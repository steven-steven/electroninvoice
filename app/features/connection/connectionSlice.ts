import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState } from '../../store';
// eslint-disable-next-line import/no-cycle
import database from '../../firebase';
// eslint-disable-next-line import/no-cycle
import {
  startListening as startListeningInvoices,
  stopListening as stopListeningInvoices,
  syncDirtyData as syncInvoices,
} from '../invoice/invoiceSlice';
// eslint-disable-next-line import/no-cycle
import {
  startListening as startListeningItems,
  stopListening as stopListeningItems,
  syncDirtyData as syncItems,
} from '../daftarBarang/daftarBarangSlice';
// eslint-disable-next-line import/no-cycle
import {
  startListening as startListeningCustomer,
  stopListening as stopListeningCustomer,
  syncDirtyData as syncCustomer,
} from '../customer/customerSlice';

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
  return (dispatch: any) => {
    database.ref('.info/connected').on('value', (snap) => {
      if (snap.val() === true) {
        // sync dirty cache when it comes back up
        dispatch(syncInvoices());
        dispatch(syncItems());
        dispatch(syncCustomer());
        // Internet Connected
        dispatch(setConnected());
        dispatch(startListeningInvoices());
        dispatch(startListeningItems());
        dispatch(startListeningCustomer());
      } else {
        // Internet Disconnected
        dispatch(setDisconnected());
        dispatch(stopListeningInvoices());
        dispatch(stopListeningItems());
        dispatch(stopListeningCustomer());
      }
    });
  };
};

export const getIsConnected = (state: RootState) => state.connection.connected;
