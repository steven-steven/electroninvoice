import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
// eslint-disable-next-line import/no-cycle
import invoiceReducer from './features/invoice/invoiceSlice';
// eslint-disable-next-line import/no-cycle
import daftarBarangReducer from './features/daftarBarang/daftarBarangSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    invoice: invoiceReducer,
    daftarBarang: daftarBarangReducer,
  });
}
