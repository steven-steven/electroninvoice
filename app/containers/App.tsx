import React, { ReactNode, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Sidebar from '../components/Sidebar';
import {
  subscribeToSyncState as listenInvoiceSyncState,
  unsubscribeToSyncState as unlistenInvoiceSyncState,
} from '../features/invoice/invoiceSlice';
import {
  subscribeToSyncState as listenItemSyncState,
  unsubscribeToSyncState as unlistenItemSyncState,
} from '../features/daftarBarang/daftarBarangSlice';
import {
  subscribeToSyncState as listenCustomerSyncState,
  unsubscribeToSyncState as unlistenCustomerSyncState,
} from '../features/customer/customerSlice';

type Props = {
  children: ReactNode;
};

export default function App(props: Props) {
  const { children } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    // Run Once
    dispatch(listenInvoiceSyncState());
    dispatch(listenItemSyncState());
    dispatch(listenCustomerSyncState());
    return function cleanup() {
      // doesn't on page request which might cause memory leak. But this is not a problem in
      dispatch(unlistenInvoiceSyncState());
      dispatch(unlistenItemSyncState());
      dispatch(unlistenCustomerSyncState());
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-56">{children}</div>
    </div>
  );
}
