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
  getIsFetched,
  saveInvoice,
  status as invoiceStatus,
} from './invoiceSlice';

export default function InvoicePage() {
  const invoices = useSelector(getInvoice);
  const status = useSelector(getStatus);
  const isFetched = useSelector(getIsFetched);
  const dispatch = useDispatch();
  // const selectedId = useSelector(getSelectedId);

  useEffect(() => {
    if (status === invoiceStatus.IDLE && !isFetched) {
      dispatch(initializeInvoices());
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
      },
      {
        Header: 'Total',
        accessor: 'totalCol',
      },
      {
        // Make an expander cell
        Header: 'Download',
        id: 'download',
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

  const invoice = {
    client: 'PT A',
    client_address: {
      address: '690 King St',
      city: 'Cilegon',
      state: 'Banten',
      country: 'Indonesia',
      postal_code: 154321,
    },
    date: '24/03/2019',
    items: [
      {
        name: 'Paku',
        rate: 10000,
        quantity: 3,
        amount: 30000,
      },
    ],
    tax: 5000,
    total: 8000,
    id: 1,
  };

  return (
    <div>
      <div className="search-container relative m-1">
        <input
          type="text"
          placeholder="Search"
          className="bg-grey-darker text-grey-light text-sm w-full p-2 pl-10 h-12 border border-grey-dark rounded"
        />
        <div className="absolute top-0 py-3 px-4 text-gray-400">
          <i className="fas fa-search fa-sm" />
        </div>
      </div>
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
