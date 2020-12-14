import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';
import database from '../../firebase';
import config from '../../config.json';
// eslint-disable-next-line import/no-cycle
import { UnsavedChanges } from '../../providers/invoiceStorage';

export interface InvoiceRequest {
  invoice_no: string;
  client: string;
  client_address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  catatanInvoice: string;
  catatanKwitansi: string;
  date: string;
  items: Item[];
  tax: number;
}

export interface Invoice extends InvoiceRequest {
  id: string;
  createdAt: string;
  total: number;
  subtotal: number;
}

export interface Item {
  name: string;
  rate: number;
  description: string;
  metricQuantity: number;
  quantity: number;
  amount: number;
}

export interface Invoices {
  [k: string]: Invoice;
}

export const status = {
  IDLE: 'idle',
  LOADING: 'loading',
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    selectedInvoice: null as string | null,
    invoices: {} as Invoices,
    status: status.IDLE,
    isFetched: false,
    isSynced: false,
  },
  reducers: {
    addInvoice: (state, invoice: PayloadAction<Invoice>) => {
      return {
        ...state,
        invoices: {
          ...state.invoices,
          [invoice.payload.id]: invoice.payload,
        },
        status: status.IDLE,
      };
    },
    loadAllInvoice: (state, invoices: PayloadAction<Invoices>) => {
      return {
        ...state,
        invoices: invoices.payload,
        status: status.IDLE,
        isFetched: true,
      };
    },
    deleteInvoice: (state, id: PayloadAction<string>) => {
      const { [id.payload]: value, ...docsToKeep } = state.invoices;
      return {
        ...state,
        invoices: docsToKeep,
        status: status.IDLE,
      };
    },
    updateInvoice: (state, invoice: PayloadAction<Invoice>) => {
      return {
        ...state,
        invoices: {
          ...state.invoices,
          [invoice.payload.id]: invoice.payload,
        },
        status: status.IDLE,
      };
    },
    selectInvoice: (state, id: PayloadAction<string>) => {
      return {
        ...state,
        selectedInvoice: id.payload,
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
  addInvoice,
  loadAllInvoice,
  deleteInvoice,
  updateInvoice,
  selectInvoice,
  setLoading,
  setIdle,
  setIsSynced,
} = invoiceSlice.actions;

/* POST
 * Mock backend fields like uuid, prices, etc. To support offline functionality.
 * These fields will be replaced when synced on db
 */
const prepareMockPostPayload = (invRequest: InvoiceRequest): Invoice => {
  const subtotal = invRequest.items.reduce(
    (accSubtotal: number, { amount }: Item) => accSubtotal + amount,
    0
  );
  const total = Math.round(subtotal + (invRequest.tax / 100) * subtotal);
  return {
    ...invRequest,
    id: `${uuidv4()}`,
    createdAt: invRequest.date,
    total,
    subtotal,
  };
};
/* PUT
 * Mock backend fields like uuid, prices, etc. To support offline functionality.
 * These fields will be replaced when synced on db
 */
const prepareMockPutPayload = (
  invRequest: InvoiceRequest,
  id: string
): Invoice => {
  const subtotal = invRequest.items.reduce(
    (accSubtotal: number, { amount }: Item) => accSubtotal + amount,
    0
  );
  const total = Math.round(subtotal + (invRequest.tax / 100) * subtotal);
  return {
    ...invRequest,
    id,
    createdAt: invRequest.date,
    total,
    subtotal,
  };
};

export const initializeOfflineInvoices = (): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().connection.connected) {
      dispatch(setLoading());
      const invoicesLocal: Invoices = await ipcRenderer.invoke(
        'invoices_getAll'
      );
      dispatch(loadAllInvoice(invoicesLocal));
    }
    // try {
    //   const res = await axios.get(`${config.serverProxy}/allInvoice`);
    //   if (res.data && res.status === 200) {
    //     dispatch(loadAllInvoice(res.data.Invoices));
    //     ipcRenderer.send('invoices_refreshNew', res.data.Invoices);
    //   } else {
    //     throw new Error(`${res.status}: ${res}`);
    //   }
    // } catch (e) {
    //   ipcRenderer.send('showError', `Gagal nge-load invoice: ${e}`);
    //   dispatch(setIdle());
    // }
  };
};

export const getInvoiceNumber = (
  dateKey: string
): AppThunk<Promise<number>> => {
  return async () => ipcRenderer.invoke('invoices_getNextInvoiceNo', dateKey);
};

export const setInvoiceNumber = (
  dateKey: string,
  newInvoiceNo: number
): AppThunk => {
  return async () => {
    ipcRenderer.send('invoices_setNextInvoiceNo', dateKey, newInvoiceNo);
  };
};

export const addInvoiceCall = (newInvoice: InvoiceRequest): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoading());
    if (!getState().connection.connected) {
      const inv: Invoice = prepareMockPostPayload(newInvoice);
      dispatch(addInvoice(inv));
      ipcRenderer.send('invoices_add', inv, false);
      return;
    }
    try {
      const res = await axios.post(`${config.serverProxy}/invoice`, newInvoice);
      if (res.data && res.status === 200) {
        const dateKey = res.data.Invoice.invoice_no.substring(0, 2);
        const invoiceNumber = parseInt(
          res.data.Invoice.invoice_no.split('-')[1],
          10
        );
        dispatch(addInvoice(res.data.Invoice));
        dispatch(setInvoiceNumber(dateKey, invoiceNumber + 1));
        ipcRenderer.send('invoices_add', res.data.Invoice, true);
      } else {
        throw new Error(`${res.status}: ${res}`);
      }
    } catch (e) {
      ipcRenderer.send('showError', `Gagal membuat invoice baru: ${e}`);
      dispatch(setIdle());
    }
  };
};

export const deleteInvoiceCall = (id: string): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const isToDelete = await ipcRenderer.invoke(
      'confirmDelete',
      `Menghapus Invoice #${id}`
    );
    if (!isToDelete) {
      return;
    }
    dispatch(setLoading());
    if (!getState().connection.connected) {
      dispatch(deleteInvoice(id));
      ipcRenderer.send('invoices_delete', id, false);
      return;
    }
    try {
      const { data } = await axios.delete(
        `${config.serverProxy}/invoice/${id}`
      );
      if (data.Success) {
        dispatch(deleteInvoice(id));
        ipcRenderer.send('invoices_delete', id, true);
      }
    } catch (e) {
      ipcRenderer.send('showError', 'Gagal menghapus');
      dispatch(setIdle());
    }
  };
};

export const updateInvoiceCall = (
  id: string,
  newInvoice: InvoiceRequest
): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoading());
    if (!getState().connection.connected) {
      const updatedInvoice: Invoice = prepareMockPutPayload(newInvoice, id);
      dispatch(updateInvoice(updatedInvoice));
      ipcRenderer.send('invoices_add', updatedInvoice, false);
      return;
    }
    try {
      const res = await axios.put(
        `${config.serverProxy}/invoice/${id}`,
        newInvoice
      );
      if (res.data && res.status === 200) {
        dispatch(updateInvoice(res.data.Invoice));
        ipcRenderer.send('invoices_add', res.data.Invoice, true);
      } else {
        throw new Error(`${res.status}: ${res}`);
      }
    } catch (e) {
      ipcRenderer.send('showError', `Gagal mengedit: ${e}`);
      dispatch(setIdle());
    }
  };
};

export const downloadInvoice = (id: string, isKwitansi?: boolean): AppThunk => {
  return (_dispatch: AppDispatch, getState: () => RootState) => {
    const invoiceState = getState().invoice;
    if (invoiceState.invoices) {
      return ipcRenderer.send(
        'download-invoice',
        invoiceState.invoices[id],
        isKwitansi
      );
    }
    return false;
  };
};

export const startListening = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    database.ref('invoice/documents').on('value', async () => {
      // const invoice = invoiceSnapshot.val();
      dispatch(setLoading());
      const { data } = await axios.get(`${config.serverProxy}/allInvoice`);
      if (data && data.Invoices) {
        dispatch(loadAllInvoice(data.Invoices));
        ipcRenderer.send('invoices_refreshNew', data.Invoices);
      }
    });
  };
};

export const subscribeToSyncState = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    ipcRenderer.on('syncStateListener', (_event, isSynced: boolean) => {
      dispatch(setIsSynced(isSynced));
    });
    ipcRenderer.send('syncStateListener');
  };
};

export const unsubscribeToSyncState = (): AppThunk => {
  return () => {
    ipcRenderer.send('removeSyncStateListener');
  };
};

/*
 *  Clean up dirty (added/updated/deleted) data in local electron-store
 */
export const syncDirtyData = (): AppThunk => {
  return async () => {
    // check if synced
    const isSynced = await ipcRenderer.invoke('invoices_getIsSynced');
    if (isSynced) return;

    // pull unsynced changes to delete/add
    const { toDelete, toAdd }: UnsavedChanges = await ipcRenderer.invoke(
      'invoices_getUnsavedChanges'
    );
    // try to delete all the marked invoices
    try {
      await Promise.all(
        toDelete.map(async (id) => {
          const { data } = await axios.delete(
            `${config.serverProxy}/invoice/${id}`
          );
          if (data.Success) {
            ipcRenderer.send('invoices_delete', id, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (delete)');
    }
    // try to add all the marked invoices
    try {
      await Promise.all(
        toAdd.map(async (invoice: Invoice) => {
          const res = await axios.put(
            `${config.serverProxy}/invoice/${invoice.id}`,
            invoice
          );
          if (res.data && res.status === 200) {
            ipcRenderer.send('invoices_add', res.data.Invoice, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (put)');
    }
    // set synced
    ipcRenderer.send('invoices_setSynced');
  };
};

export const stopListening = (): AppThunk => {
  return () => {
    database.ref('invoice/documents').off();
  };
};

export default invoiceSlice.reducer;

export const getInvoice = (state: RootState) => state.invoice.invoices;
export const getStatus = (state: RootState) => state.invoice.status;
export const getIsFetched = (state: RootState) => state.invoice.isFetched;
export const getSelectedId = (state: RootState) =>
  state.invoice.selectedInvoice;
export const getIsSynced = (state: RootState) => state.invoice.isSynced;
