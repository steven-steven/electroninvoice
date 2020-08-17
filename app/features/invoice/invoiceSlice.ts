import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';

export interface InvoiceRequest {
  client: string;
  date: string;
  items: Item[];
  tax?: number;
}

export interface Invoice extends InvoiceRequest {
  id: number;
  createdAt: string;
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

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    selectedInvoice: null as number | null,
    invoices: {} as Invoices,
  },
  reducers: {
    addInvoice: (state, invoice: PayloadAction<Invoice>) => {
      return {
        ...state,
        invoices: {
          ...state.invoices,
          [invoice.payload.id]: invoice.payload,
        },
      };
    },
    loadAllInvoice: (state, invoices: PayloadAction<Invoices>) => {
      return {
        ...state,
        invoices: invoices.payload,
      };
    },
    deleteInvoice: (state, id: PayloadAction<number>) => {
      const clone = { ...state };
      delete clone.invoices[id.payload];
      return clone;
    },
    updateInvoice: (state, invoice: PayloadAction<Invoice>) => {
      return {
        ...state,
        invoices: {
          ...state.invoices,
          [invoice.payload.id]: invoice.payload,
        },
      };
    },
    selectInvoice: (state, id: PayloadAction<number>) => {
      return {
        ...state,
        selectedInvoice: id.payload,
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
} = invoiceSlice.actions;

export const initializeInvoices = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    return axios
      .get('https://go-invoice-api.herokuapp.com/allInvoice')
      .then(({ data }) => dispatch(loadAllInvoice(data.Invoices)));
  };
};

export const addInvoiceCall = (newInvoice: InvoiceRequest): AppThunk => {
  return (dispatch: AppDispatch) => {
    return axios
      .post('https://go-invoice-api.herokuapp.com/invoice', newInvoice)
      .then(({ data }) => dispatch(addInvoice(data.Invoice)));
  };
};

export const deleteInvoiceCall = (id: number): AppThunk => {
  return (dispatch: AppDispatch) => {
    return axios
      .delete(`https://go-invoice-api.herokuapp.com/invoice/${id}`)
      .then(({ data }) => {
        if (data.Success) {
          dispatch(deleteInvoice(id));
        }
        return data;
      });
  };
};

export const updateInvoiceCall = (
  id: string,
  newInvoice: InvoiceRequest
): AppThunk => {
  return (dispatch: AppDispatch) => {
    return axios
      .put('https://go-invoice-api.herokuapp.com/invoice', {
        ID: id,
        Invoice: newInvoice,
      })
      .then(({ data }) => dispatch(updateInvoice(data.Invoice)));
  };
};

export default invoiceSlice.reducer;

export const getInvoice = (state: RootState) => state.invoice.invoices;
export const getSelectedId = (state: RootState) =>
  state.invoice.selectedInvoice;
