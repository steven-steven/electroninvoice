import React, { ReactNode, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Sidebar from '../components/Sidebar';
import {
  subscribeToSyncState,
  unsubscribeToSyncState,
} from '../features/invoice/invoiceSlice';

type Props = {
  children: ReactNode;
};

export default function App(props: Props) {
  const { children } = props;
  const dispatch = useDispatch();

  useEffect(() => {
    // Run Once
    dispatch(subscribeToSyncState());
    return function cleanup() {
      // doesn't on page request which might cause memory leak. But this is not a problem in
      dispatch(unsubscribeToSyncState());
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-56">{children}</div>
    </div>
  );
}
