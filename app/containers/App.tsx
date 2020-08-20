import React, { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {
  children: ReactNode;
};

export default function App(props: Props) {
  const { children } = props;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-56">{children}</div>
    </div>
  );
}
