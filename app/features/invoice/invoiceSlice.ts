import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';

export interface InvoiceRequest {
  client: string;
  client_address?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  date: string;
  items: Item[];
  tax: number;
}

export interface Invoice extends InvoiceRequest {
  id: number;
  createdAt: string;
  total: number;
}

export interface Item {
  name: string;
  rate: number;
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
    selectedInvoice: null as number | null,
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
    deleteInvoice: (state, id: PayloadAction<number>) => {
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
    selectInvoice: (state, id: PayloadAction<number>) => {
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
  },
});

export const {
  addInvoice,
  loadAllInvoice,
  deleteInvoice,
  updateInvoice,
  selectInvoice,
  setLoading,
} = invoiceSlice.actions;

export const initializeInvoices = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .get('https://go-invoice-api.herokuapp.com/allInvoice')
      .then(({ data }) => dispatch(loadAllInvoice(data.Invoices)));
  };
};

export const addInvoiceCall = (newInvoice: InvoiceRequest): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .post('https://go-invoice-api.herokuapp.com/invoice', newInvoice)
      .then(({ data }) => dispatch(addInvoice(data.Invoice)));
  };
};

export const deleteInvoiceCall = (id: number): AppThunk => {
  return async (dispatch: AppDispatch) => {
    const isToDelete = await ipcRenderer.invoke(
      'confirmDeleteInvoice',
      id.toString()
    );
    if (!isToDelete) {
      return;
    }
    dispatch(setLoading());
    const { data } = await axios.delete(
      `https://go-invoice-api.herokuapp.com/invoice/${id}`
    );
    if (data.Success) {
      dispatch(deleteInvoice(id));
    }
  };
};

export const updateInvoiceCall = (
  id: number,
  newInvoice: InvoiceRequest
): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .put(`https://go-invoice-api.herokuapp.com/invoice/${id}`, newInvoice)
      .then(({ data }) => dispatch(updateInvoice(data.Invoice)));
  };
};

export const saveInvoice = (id: number): AppThunk => {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const invoiceState = getState().invoice;
    if (invoiceState.invoices) {
      return ipcRenderer.send(
        'save-invoice',
        invoiceState.invoices[id.toString()]
      );
    }
    return false;
  };
};

export default invoiceSlice.reducer;

export const getInvoice = (state: RootState) => state.invoice.invoices;
export const getStatus = (state: RootState) => state.invoice.status;
export const getIsFetched = (state: RootState) => state.invoice.isFetched;
export const getSelectedId = (state: RootState) =>
  state.invoice.selectedInvoice;
