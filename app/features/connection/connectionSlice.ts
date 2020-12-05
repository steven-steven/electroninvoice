import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState } from '../../store';
// eslint-disable-next-line import/no-cycle
import database from '../../firebase';
// eslint-disable-next-line import/no-cycle
import {
  startListening as startListeningInvoices,
  stopListening as stopListeningInvoices,
} from '../invoice/invoiceSlice';
// eslint-disable-next-line import/no-cycle
import {
  startListening as startListeningItems,
  stopListening as stopListeningItems,
} from '../daftarBarang/daftarBarangSlice';

const connectionSlice = createSlice({
  name: 'connection',
  initialState: {
    connected: false,
  },
  reducers: {
    setConnected: (state) => {
      return {
        ...state,
        connected: true,
      };
    },
    setDisconnected: (state) => {
      return {
        ...state,
        connected: false,
      };
    },
  },
});

export const { setConnected, setDisconnected } = connectionSlice.actions;

export default connectionSlice.reducer;

export const startListening = (): AppThunk => {
  return (dispatch) => {
    database.ref('.info/connected').on('value', (snap) => {
      if (snap.val() === true) {
        // Internet Connected
        dispatch(setConnected());
        dispatch(startListeningInvoices());
        dispatch(startListeningItems());
      } else {
        // Internet Disconnected
        dispatch(setDisconnected());
        dispatch(stopListeningInvoices());
        dispatch(stopListeningItems());
      }
    });
  };
};

export const isConnected = (state: RootState) => state.connection.connected;
