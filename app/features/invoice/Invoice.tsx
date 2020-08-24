import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CellProps } from 'react-table';
import { Link } from 'react-router-dom';
import routes from '../../constants/routes.json';
import MyTable from '../../components/MyTable';
import {
  initializeInvoices,
  addInvoiceCall,
  deleteInvoiceCall,
  updateInvoiceCall,
  selectInvoice,
  getInvoice,
  getStatus,
  Invoice,
  startListening,
  getIsFetched,
  saveInvoice,
  status as invoiceStatus,
} from './invoiceSlice';
import { startListening as startListeningItems } from '../daftarBarang/daftarBarangSlice';

export default function InvoicePage() {
  const invoices = useSelector(getInvoice);
  const status = useSelector(getStatus);
  const isFetched = useSelector(getIsFetched);
  const dispatch = useDispatch();
  // const selectedId = useSelector(getSelectedId);

  useEffect(() => {
    if (status === invoiceStatus.IDLE && !isFetched) {
      // dispatch(initializeInvoices()); Unneeded since startListening is triggered in the beginning
      dispatch(startListening());
      dispatch(startListeningItems());
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
        Header: 'Download',
        id: 'download',
        collapse: true,
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<Invoice>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(saveInvoice(row.values.idCol))}
            >
              <i className="far fa-file-pdf fa-md" />
            </button>
          );
        },
      },
      {
        Header: 'Edit',
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
        Header: 'Delete',
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
    []
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
