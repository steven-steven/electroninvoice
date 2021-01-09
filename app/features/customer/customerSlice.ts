import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import MomentTz from 'moment-timezone';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';
import database from '../../firebase';
import config from '../../config.json';
// eslint-disable-next-line import/no-cycle
import { UnsavedChanges } from '../../providers/customerStorage';

export interface CustomerRequest {
  client: string;
  client_address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  phone: string;
}

export interface Customer extends CustomerRequest {
  id: string;
  createdAt: string;
}

export interface Customers {
  [k: string]: Customer;
}

export const status = {
  IDLE: 'idle',
  LOADING: 'loading',
};

const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    selectedCustomer: null as string | null,
    customers: {} as Customers,
    status: status.IDLE,
    isFetched: false,
    isSynced: false,
  },
  reducers: {
    addCustomer: (state, customer: PayloadAction<Customer>) => {
      return {
        ...state,
        customers: {
          ...state.customers,
          [customer.payload.id]: customer.payload,
        },
        status: status.IDLE,
      };
    },
    loadAllCustomer: (state, customers: PayloadAction<Customers>) => {
      return {
        ...state,
        customers: customers.payload,
        status: status.IDLE,
        isFetched: true,
      };
    },
    deleteCustomer: (state, id: PayloadAction<string>) => {
      const { [id.payload]: value, ...docsToKeep } = state.customers;
      return {
        ...state,
        customers: docsToKeep,
        status: status.IDLE,
        selectedCustomer: null,
      };
    },
    updateCustomer: (state, customer: PayloadAction<Customer>) => {
      return {
        ...state,
        customers: {
          ...state.customers,
          [customer.payload.id]: customer.payload,
        },
        selectedCustomer: null,
        status: status.IDLE,
      };
    },
    selectCustomer: (state, id: PayloadAction<string>) => {
      return {
        ...state,
        selectedCustomer: id.payload,
      };
    },
    deselectCustomer: (state) => {
      return {
        ...state,
        selectedCustomer: null,
      };
    },
    setLoading: (state) => {
      return {
        ...state,
        status: status.LOADING,
      };
    },
    setIdle: (state) => {
      return {
        ...state,
        status: status.IDLE,
      };
    },
    setIsSynced: (state, isSynced: PayloadAction<boolean>) => {
      return {
        ...state,
        isSynced: isSynced.payload,
      };
    },
  },
});

export const {
  addCustomer,
  loadAllCustomer,
  deleteCustomer,
  updateCustomer,
  selectCustomer,
  deselectCustomer,
  setLoading,
  setIdle,
  setIsSynced,
} = customerSlice.actions;

/* POST & PUT
 * provide id if it's a put
 * Mock backend fields like uuid, prices, etc. To support offline functionality.
 * These fields will be replaced when synced on db
 */
const prepareMockPostPayload = (
  customerRequest: CustomerRequest,
  id?: string
): Customer => {
  return {
    ...customerRequest,
    id: id || `${uuidv4()}`,
    createdAt: MomentTz().tz('Asia/Jakarta').format('DD/MM/YYYY'),
  };
};

export const initializeOfflineCustomers = (): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().connection.connected) {
      dispatch(setLoading());
      const customersLocal: Customers = await ipcRenderer.invoke(
        'customers_getAll'
      );
      dispatch(loadAllCustomer(customersLocal));
    }
  };
};

export const addCustomerCall = (newCustomer: CustomerRequest): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoading());
    if (!getState().connection.connected) {
      const customer: Customer = prepareMockPostPayload(newCustomer);
      dispatch(addCustomer(customer));
      ipcRenderer.send('customers_add', customer, false);
      return;
    }
    try {
      const res = await axios.post(
        `${config.serverProxy}/customer`,
        newCustomer
      );
      if (res.data && res.status === 200) {
        dispatch(addCustomer(res.data.Customer));
        ipcRenderer.send('customers_add', res.data.Customer, true);
      } else {
        throw new Error(`${res.status}: ${res}`);
      }
    } catch (e) {
      ipcRenderer.send('showError', `Gagal membuat customer baru: ${e}`);
      dispatch(setIdle());
    }
  };
};

export const deleteCustomerCall = (id: string): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const clientName = getState().customer.customers[id].client;
    const isToDelete = await ipcRenderer.invoke(
      'confirmDelete',
      `Menghapus Customer #${clientName}`
    );
    if (!isToDelete) {
      return;
    }
    const invoicesOwned = Object.values(getState().invoice.invoices);
    for (let i = 0; i < invoicesOwned.length; i += 1) {
      if (invoicesOwned[i].customerId === id) {
        // cancel delete if customer has an invoice
        ipcRenderer.send(
          'showError',
          'Gagal menghapus customer, karena customer ini mempunyai sejumlah invoice yang belum terhapus.'
        );
        return;
      }
    }
    dispatch(setLoading());
    if (!getState().connection.connected) {
      dispatch(deleteCustomer(id));
      ipcRenderer.send('customers_delete', id, false);
      return;
    }
    try {
      const { data } = await axios.delete(
        `${config.serverProxy}/customer/${id}`
      );
      if (data.Success) {
        dispatch(deleteCustomer(id));
        ipcRenderer.send('customers_delete', id, true);
      }
    } catch (e) {
      ipcRenderer.send('showError', 'Gagal menghapus');
      dispatch(setIdle());
    }
  };
};

export const updateCustomerCall = (
  id: string,
  newCustomer: CustomerRequest
): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoading());
    if (!getState().connection.connected) {
      const updatedCustomer: Customer = prepareMockPostPayload(newCustomer, id);
      dispatch(updateCustomer(updatedCustomer));
      ipcRenderer.send('customers_add', updatedCustomer, false);
      return;
    }
    try {
      const res = await axios.put(
        `${config.serverProxy}/customer/${id}`,
        newCustomer
      );
      if (res.data && res.status === 200) {
        dispatch(updateCustomer(res.data.Customer));
        ipcRenderer.send('customers_add', res.data.Customer, true);
      } else {
        throw new Error(`${res.status}: ${res}`);
      }
    } catch (e) {
      ipcRenderer.send('showError', `Gagal mengedit: ${e}`);
      dispatch(setIdle());
    }
  };
};

export const startListening = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    database.ref('invoice/customers').on('value', async () => {
      dispatch(setLoading());
      const { data } = await axios.get(`${config.serverProxy}/allCustomer`);
      if (data && data.Customers) {
        dispatch(loadAllCustomer(data.Customers));
        ipcRenderer.send('customers_refreshNew', data.Customers);
      }
    });
  };
};

export const subscribeToSyncState = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    ipcRenderer.on(
      'customer_syncStateListener',
      (_event, isSynced: boolean) => {
        dispatch(setIsSynced(isSynced));
      }
    );
    ipcRenderer.send('customer_syncStateListener');
  };
};

export const unsubscribeToSyncState = (): AppThunk => {
  return () => {
    ipcRenderer.send('customer_removeSyncStateListener');
  };
};

/*
 *  Clean up dirty (added/updated/deleted) data in local electron-store
 */
export const syncDirtyData = (): AppThunk => {
  return async () => {
    // check if synced
    const isSynced = await ipcRenderer.invoke('customers_getIsSynced');
    if (isSynced) return;

    // pull unsynced changes to delete/add
    const { toDelete, toAdd }: UnsavedChanges = await ipcRenderer.invoke(
      'customers_getUnsavedChanges'
    );
    // try to delete all the marked invoices
    try {
      await Promise.all(
        toDelete.map(async (id) => {
          const { data } = await axios.delete(
            `${config.serverProxy}/customer/${id}`
          );
          if (data.Success) {
            ipcRenderer.send('customers_delete', id, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (delete)');
    }
    // try to add all the marked customer
    try {
      await Promise.all(
        toAdd.map(async (customer: Customer) => {
          const res = await axios.put(
            `${config.serverProxy}/customer/${customer.id}`,
            customer
          );
          if (res.data && res.status === 200) {
            ipcRenderer.send('customers_add', res.data.Customer, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (put)');
    }
    // set synced
    ipcRenderer.send('customers_setSynced');
  };
};

export const stopListening = (): AppThunk => {
  return () => {
    database.ref('invoice/documents').off();
  };
};

export default customerSlice.reducer;

export const getCustomer = (state: RootState) => state.customer.customers;
export const getStatus = (state: RootState) => state.customer.status;
export const getIsFetched = (state: RootState) => state.customer.isFetched;
export const getSelectedCustomer = (state: RootState) => {
  if (state.customer.selectedCustomer != null) {
    return state.customer.customers[state.customer.selectedCustomer];
  }
  return null;
};
export const getIsSynced = (state: RootState) => state.customer.isSynced;
