import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CellProps } from 'react-table';
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
  const status = useSelector(getStatus);

  // const data = React.useMemo(
  //   () =>
  //     Object.values(invoices).map((invoice) => {
  //       return {
  //         idCol: invoice.id,
  //         clientCol: invoice.client,
  //         dateCol: invoice.date,
  //         totalCol: invoice.total,
  //       };
  //     }),
  //   [invoices]
  // );

  // const columns = React.useMemo(
  //   () => [
  //     {
  //       Header: 'Daftar Invoice',
  //       columns: [
  //         {
  //           Header: 'No. Invoice',
  //           accessor: 'idCol',
  //         },
  //         {
  //           Header: 'Nama Customer',
  //           accessor: 'clientCol',
  //         },
  //         {
  //           Header: 'Tanggal Invoice',
  //           accessor: 'dateCol',
  //         },
  //         {
  //           Header: 'Total',
  //           accessor: 'totalCol',
  //         },
  //         {
  //           // Make an expander cell
  //           Header: 'Download',
  //           id: 'download',
  //           // eslint-disable-next-line react/display-name
  //           Cell: ({ row }: CellProps<Invoice>) => {
  //             return (
  //               <button
  //                 type="button"
  //                 onClick={() => dispatch(saveInvoice(row.values.idCol))}
  //               >
  //                 <i className="far fa-file-pdf fa-sm" />
  //                 Download
  //               </button>
  //             );
  //           },
  //         },
  //       ],
  //     },
  //   ],
  //   []
  // );

  return (
    <div>
      {status === invoiceStatus.LOADING ? (
        <div className="text-center">
          <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
        </div>
      ) : (
        <div>Hello</div>
      )}
    </div>
  );
}
