import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CellProps } from 'react-table';
import { Link } from 'react-router-dom';
import routes from '../../constants/routes.json';
import MyTable from '../../components/MyTable';
import {
  deleteInvoiceCall,
  getInvoice,
  getStatus,
  Invoice,
  getIsFetched,
  downloadInvoice,
  backupToCSV,
  initializeOfflineInvoices,
  getIsSynced,
  status as invoiceStatus,
  viewInvoice,
} from './invoiceSlice';
import { initializeOfflineItems } from '../daftarBarang/daftarBarangSlice';
import {
  getCustomer,
  initializeOfflineCustomers,
} from '../customer/customerSlice';
import { startListening, getIsConnected } from '../connection/connectionSlice';

export default function InvoicePage() {
  const invoices = useSelector(getInvoice);
  const customers = useSelector(getCustomer);
  const status = useSelector(getStatus);
  const isFetched = useSelector(getIsFetched);
  const isConnected = useSelector(getIsConnected);
  const isSynced = useSelector(getIsSynced);
  const dispatch = useDispatch();
  // const selectedId = useSelector(getSelectedId);

  useEffect(() => {
    // get data from local (if first load has no connection)
    if (status === invoiceStatus.IDLE && !isFetched && !isConnected) {
      dispatch(initializeOfflineInvoices());
      dispatch(initializeOfflineItems());
      dispatch(initializeOfflineCustomers());
    }
  }, [dispatch, isFetched, status, isConnected]);

  useEffect(() => {
    if (status === invoiceStatus.IDLE && !isFetched) {
      // dispatch(initializeInvoices()); Unneeded since startListening is triggered in the beginning
      dispatch(startListening());
    }
  }, [dispatch, isFetched, status]);

  const data = React.useMemo(
    () =>
      Object.values(invoices).map((invoice) => {
        return {
          id: invoice.id,
          invoiceNo: invoice.invoice_no,
          clientCol: customers[invoice.customerId]?.client,
          dateCol: invoice.date,
          totalCol: invoice.total.toLocaleString('id'),
        };
      }),
    [customers, invoices]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'No. Invoice',
        id: 'sortableCol',
        accessor: 'invoiceNo',
      },
      {
        Header: 'Nama Customer',
        accessor: 'clientCol',
      },
      {
        Header: 'Tanggal Invoice',
        accessor: 'dateCol',
        disableSortBy: true,
      },
      {
        Header: 'Total',
        accessor: 'totalCol',
        disableSortBy: true,
      },
      {
        Header: 'Lihat Invoice',
        id: 'view',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(viewInvoice(row.original.id))}
            >
              <i className="far fa-eye fa-md" />
            </button>
          );
        },
      },
      {
        // Make an expander cell
        Header: 'Unduh Invoice',
        id: 'download',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(downloadInvoice(row.original.id))}
            >
              <i className="far fa-file-pdf fa-md" />
            </button>
          );
        },
      },
      {
        Header: 'Ubah',
        id: 'edit',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <Link
              to={{
                pathname: routes.ADDINVOICE,
                search: `?id=${row.original.id}`,
              }}
            >
              <i className="far fa-edit fa-md" />
            </Link>
          );
        },
      },
      {
        Header: 'Hapus',
        id: 'delete',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(deleteInvoiceCall(row.original.id))}
            >
              <i className="far fa-trash-alt fa-md" />
            </button>
          );
        },
      },
    ],
    [dispatch]
  );

  return (
    <div>
      <div className="p-3 ml-3 text-gray-700 rounded-lg">
        <p className="text-xs">
          Status:&nbsp;
          {isSynced
            ? '✅ tersimpan'
            : '❌ sedang mencari koneksi internet untuk sinkronisasi data... (sementara ini, data sudah tersimpan dalam sistem)'}
        </p>
        <p className="text-xs">
          Internet:&nbsp;
          {isConnected ? '✅ terhubung' : '❌ terputus'}
        </p>
        <p className="text-xs">
          Unduh Backup:&nbsp;
          <button type="button" onClick={() => dispatch(backupToCSV())}>
            <i className="far fa-file-excel fa-md" />
          </button>
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        {status === invoiceStatus.LOADING ? (
          <div className="text-center">
            <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
          </div>
        ) : (
          <div className="flex flex-col w-11/12 p-3 text-center text-gray-700 bg-white rounded-lg shadow-md tableBox">
            <span className="mb-3 ml-5 text-2xl font-light text-left font-display">
              Daftar Invoice
            </span>
            <MyTable columns={columns} data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
