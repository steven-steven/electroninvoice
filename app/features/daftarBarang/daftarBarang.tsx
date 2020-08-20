import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CellProps } from 'react-table';
import MyTable from '../../components/MyTable';
import {
  getStatus,
  getIsFetched,
  status as invoiceStatus,
} from './daftarBarangSlice';

export default function InvoicePage() {
  const status = useSelector(getStatus);

  return (
    <div>
      {status === invoiceStatus.LOADING ? (
        <div className="text-center">
          <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
        </div>
      ) : (
        <div>Daftar Barang</div>
      )}
    </div>
  );
}
