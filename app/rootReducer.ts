import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
// eslint-disable-next-line import/no-cycle
import invoiceReducer from './features/invoice/invoiceSlice';
// eslint-disable-next-line import/no-cycle
import daftarBarangReducer from './features/daftarBarang/daftarBarangSlice';
// eslint-disable-next-line import/no-cycle
import connectionReducer from './features/connection/connectionSlice';
// eslint-disable-next-line import/no-cycle
import customerReducer from './features/customer/customerSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    invoice: invoiceReducer,
    customer: customerReducer,
    daftarBarang: daftarBarangReducer,
    connection: connectionReducer,
  });
}
