import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';
import database, { firebase } from '../../firebase';
import config from '../../config.json';

export interface InvoiceRequest {
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
} = invoiceSlice.actions;

export const initializeInvoices = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .get(`${config.serverProxy}/allInvoice`)
      .then(({ data }) => dispatch(loadAllInvoice(data.Invoices)))
      .catch((e) => {
        ipcRenderer.send('showError', `Gagal ng-load invoice: ${e}`);
        dispatch(setIdle());
      });
  };
};

export const addInvoiceCall = (newInvoice: InvoiceRequest): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .post(`${config.serverProxy}/invoice`, newInvoice)
      .then(({ data }) => dispatch(addInvoice(data.Invoice)))
      .catch((e) => {
        ipcRenderer.send('showError', `Gagal membuat invoice baru: ${e}`);
        dispatch(setIdle());
      });
  };
};

export const deleteInvoiceCall = (id: string): AppThunk => {
  return async (dispatch: AppDispatch) => {
    try {
      const isToDelete = await ipcRenderer.invoke(
        'confirmDelete',
        `Menghapus Invoice #${id}`
      );
      if (!isToDelete) {
        return;
      }
      dispatch(setLoading());
      const { data } = await axios.delete(
        `${config.serverProxy}/invoice/${id}`
      );
      if (data.Success) {
        dispatch(deleteInvoice(id));
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
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .put(`${config.serverProxy}/invoice/${id}`, newInvoice)
      .then(({ data }) => dispatch(updateInvoice(data.Invoice)))
      .catch((e) => {
        ipcRenderer.send('showError', `Gagal mengedit: ${e}`);
        dispatch(setIdle());
      });
  };
};

export const saveInvoice = (id: string): AppThunk => {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const invoiceState = getState().invoice;
    if (invoiceState.invoices) {
      return ipcRenderer.send('save-invoice', invoiceState.invoices[id]);
    }
    return false;
  };
};

export const startListening = (): AppThunk => {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    database.ref('invoice/documents').on('value', (invoiceSnapshot) => {
      // const invoice = invoiceSnapshot.val();
      dispatch(setLoading());
      return axios
        .get(`${config.serverProxy}/allInvoice`)
        .then(({ data }) => dispatch(loadAllInvoice(data.Invoices)));
    });
  };
};

export default invoiceSlice.reducer;

export const getInvoice = (state: RootState) => state.invoice.invoices;
export const getStatus = (state: RootState) => state.invoice.status;
export const getIsFetched = (state: RootState) => state.invoice.isFetched;
export const getSelectedId = (state: RootState) =>
  state.invoice.selectedInvoice;
