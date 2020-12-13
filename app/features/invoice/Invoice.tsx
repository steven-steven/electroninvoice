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
  initializeOfflineInvoices,
  status as invoiceStatus,
} from './invoiceSlice';
import { startListening, getIsConnected } from '../connection/connectionSlice';

export default function InvoicePage() {
  const invoices = useSelector(getInvoice);
  const status = useSelector(getStatus);
  const isFetched = useSelector(getIsFetched);
  const isConnected = useSelector(getIsConnected);
  const dispatch = useDispatch();
  // const selectedId = useSelector(getSelectedId);

  useEffect(() => {
    // get data from local (if first load has no connection)
    if (status === invoiceStatus.IDLE && !isFetched && !isConnected) {
      dispatch(initializeOfflineInvoices());
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
          idCol: invoice.id,
          clientCol: invoice.client,
          dateCol: invoice.date,
          totalCol: invoice.total,
        };
      }),
    [invoices]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'No. Invoice',
        accessor: 'idCol',
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
        // Make an expander cell
        Header: 'Unduh Invoice',
        id: 'download',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(downloadInvoice(row.values.idCol))}
            >
              <i className="far fa-file-pdf fa-md" />
            </button>
          );
        },
      },
      {
        // Make an expander cell
        Header: 'Unduh Kwitansi',
        id: 'kwitansi',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(downloadInvoice(row.values.idCol, true))}
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
                search: `?id=${row.values.idCol}`,
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
              onClick={() => dispatch(deleteInvoiceCall(row.values.idCol))}
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
      <div className="mt-8 flex items-center justify-center">
        {status === invoiceStatus.LOADING ? (
          <div className="text-center">
            <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
          </div>
        ) : (
          <div className="tableBox w-11/12 flex flex-col text-center text-gray-700 bg-white shadow-md rounded-lg p-3">
            <span className="text-left text-2xl ml-5 mb-3 font-display font-light">
              Daftar Invoice
            </span>
            <MyTable columns={columns} data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
