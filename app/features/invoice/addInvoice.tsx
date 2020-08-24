import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useLocation, useHistory } from 'react-router-dom';
import Moment from 'moment';
import MomentTz from 'moment-timezone';
import routes from '../../constants/routes.json';
import EditableTable from '../../components/EditableTable';
import {
  initializeInvoices,
  addInvoiceCall,
  deleteInvoiceCall,
  updateInvoiceCall,
  selectInvoice,
  getInvoice,
  getStatus as getInvoiceStatus,
  InvoiceRequest,
  getIsFetched,
  saveInvoice,
  status as invoiceStatus,
} from './invoiceSlice';
import {
  Item,
  getStatus as getItemStatus,
  getItem,
  status as itemStatus,
} from '../daftarBarang/daftarBarangSlice';

import { RootState } from '../../store';

interface TableData {
  transaksi: string;
  deskripsi: string;
  jumlah: string;
  harga: string;
}
interface RightInvoiceForm {
  clientName: string;
  date: string;
  tax: string;
}

export default function InvoicePage() {
  const currInvoiceStatus = useSelector(getInvoiceStatus);
  const currItemStatus = useSelector(getItemStatus);
  const items = useSelector(getItem);
  const dispatch = useDispatch();
  const history = useHistory();

  const itemList = React.useMemo(
    () =>
      Object.values(items).map((item) => {
        return {
          itemName: item.name,
          itemDesc: item.defaultDesc,
          itemRate: item.rate,
          itemId: item.id,
        };
      }),
    [items]
  );

  // check if its Edit or new Invoice page
  const editQueryString = useLocation().search;
  const editId = new URLSearchParams(editQueryString).get('id');
  const invoiceToEdit = useSelector((state: RootState) => {
    if (editId) {
      return state.invoice.invoices[editId];
    }
    return null;
  });

  // table data
  const initialItems: TableData[] = invoiceToEdit
    ? invoiceToEdit.items.map((item) => {
        return {
          transaksi: item.name,
          deskripsi: item.description,
          jumlah: item.quantity.toString(),
          harga: item.rate.toString(),
        };
      })
    : [];
  const [rowData, setRowData] = useState<TableData[]>(initialItems);
  const [originalData] = useState(rowData);
  const [selectedTransaction, setSelectedTransaction] = useState(''); // react-form-hook watcher doesn't seem to work for select
  const [skipPageReset, setSkipPageReset] = useState(false);

  // form data
  const {
    register: itemFormRegister,
    handleSubmit: itemFormHandleSubmit,
    errors: itemFormError,
    reset: itemReset,
  } = useForm();
  const {
    register: invoiceFormRegister,
    handleSubmit: invoiceFormHandleSubmit,
    errors: invoiceFormError,
    watch: invoiceWatch,
  } = useForm();

  const addToRowData = (data: TableData) => {
    const chosenItem = items[data.transaksi];
    setRowData([
      ...rowData,
      {
        transaksi: chosenItem.name,
        deskripsi: data.deskripsi || chosenItem.defaultDesc,
        jumlah: data.jumlah,
        harga: chosenItem.rate.toString(),
      },
    ]);
    itemReset();
  };

  const submitInvoice = (data: RightInvoiceForm) => {
    const newInvoice: InvoiceRequest = {
      client: data.clientName,
      client_address: {
        address: '690 King St',
        city: 'Cilegon',
        state: 'Banten',
        country: 'Indonesia',
        postal_code: '154321',
      },
      date: Moment(data.date).format('DD/MM/YYYY'),
      items: rowData.map((item) => {
        return {
          name: item.transaksi,
          description: item.deskripsi,
          rate: parseInt(item.harga, 10),
          quantity: parseInt(item.jumlah, 10),
          amount: parseInt(item.harga, 10) * parseInt(item.jumlah, 10),
        };
      }),
      tax: parseInt(data.tax, 10),
    };

    if (invoiceToEdit != null) {
      dispatch(updateInvoiceCall(invoiceToEdit.id, newInvoice));
      history.push(routes.INVOICE);
    } else {
      dispatch(addInvoiceCall(newInvoice));
    }
  };

  // When our cell renderer calls updateMyData, we'll use
  // the rowIndex, columnId and new value to update the
  // original data
  const updateMyData = (
    rowIndex: number,
    columnId: string,
    value: string | number
  ) => {
    // We also turn on the flag to not reset the page
    setSkipPageReset(true);
    setRowData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  // After data chagnes, we turn the flag back off
  // so that if data actually changes when we're not
  // editing it, the page is reset
  React.useEffect(() => {
    setSkipPageReset(false);
  }, [rowData]);

  const resetData = () => setRowData(originalData);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Barang/Jasa',
        columns: [
          {
            Header: 'Transaksi',
            accessor: 'transaksi',
          },
          {
            Header: 'Deskripsi',
            accessor: 'deskripsi',
          },
          {
            Header: 'Jumlah',
            accessor: 'jumlah',
          },
          {
            Header: 'Harga / unit',
            accessor: 'harga',
          },
        ],
      },
    ],
    []
  );

  let tax = invoiceWatch('tax');
  if (tax == null) tax = 0;

  return (
    <div>
      {currInvoiceStatus === invoiceStatus.LOADING ||
      currItemStatus === itemStatus.LOADING ? (
        <div className="text-center">
          <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
        </div>
      ) : (
        <div className="pageContainer p-6 flex justify-between flex-wrap-reverse">
          <div className="leftBox flex flex-col pr-0 md:pr-8 w-full md:w-2/3">
            <div className="AddItemBox flex flex-col text-center text-gray-700 bg-white px-4 py-2 shadow-md">
              <form onSubmit={itemFormHandleSubmit(addToRowData)}>
                <div className="formBox text-left">
                  <label htmlFor="transaksi">
                    Barang/Jasa *
                    <div className="relative">
                      <select
                        className={`block mb-3 h-12 w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                          itemFormError.transaksi ? 'border-red-500' : ''
                        }`}
                        id="transaksi"
                        name="transaksi"
                        onChange={(e) => {
                          setSelectedTransaction(e.target.value);
                        }}
                        ref={itemFormRegister({ required: true })}
                        defaultValue=""
                      >
                        <option disabled value="">
                          -- select an option --
                        </option>
                        {itemList.map((item) => {
                          return (
                            <option key={item.itemId} value={item.itemId}>
                              {item.itemName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </label>
                  <label htmlFor="jumlah">
                    Jumlah *
                    <input
                      id="jumlah"
                      name="jumlah"
                      min="1"
                      ref={itemFormRegister({ required: true })}
                      type="number"
                      className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        itemFormError.jumlah ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                  <label htmlFor="deskripsi">
                    Deskripsi
                    <input
                      id="deskripsi"
                      name="deskripsi"
                      ref={itemFormRegister}
                      type="text"
                      placeholder={
                        items[selectedTransaction]
                          ? items[selectedTransaction].defaultDesc
                          : ''
                      }
                      className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        itemFormError.description ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                </div>
                <div className="actionBox">
                  <button
                    type="submit"
                    className="w-auto float-right mb-3 bg-transparent hover:bg-blue-600 text-black font-semibold hover:text-white py-2 px-4 border border-black hover:border-transparent rounded"
                  >
                    Tambah
                  </button>
                </div>
              </form>
            </div>
            <div className="tableBox mt-8 flex flex-col text-center text-gray-700 bg-white shadow-md rounded-lg p-3">
              <EditableTable
                columns={columns}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                data={rowData}
                updateMyData={updateMyData}
                skipPageReset={skipPageReset}
              />
              <div className="actionBox">
                <button
                  className="w-auto float-right mt-5 hover:bg-gray-100 text-xs text-gray-800 py-1 px-4 border border-gray-400 rounded"
                  type="button"
                  onClick={resetData}
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
          <div className="rightBox flex flex-col w-full md:w-1/3">
            <form onSubmit={invoiceFormHandleSubmit(submitInvoice)}>
              <div className="invoiceInfoBox flex flex-col text-center text-gray-700 bg-white px-4 py-2 shadow-md">
                <div className="text-2xl mb-6 mt-4">
                  {invoiceToEdit == null
                    ? 'Invoice Baru'
                    : `Edit invoice #${invoiceToEdit.id}`}
                </div>
                <div className="formBox text-left">
                  <label htmlFor="clientName">
                    Nama Client *
                    <input
                      id="clientName"
                      name="clientName"
                      type="text"
                      defaultValue={
                        invoiceToEdit == null ? '' : invoiceToEdit.client
                      }
                      ref={invoiceFormRegister({ required: true })}
                      placeholder="Pt. X"
                      className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        invoiceFormError.clientName ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                  <label htmlFor="date">
                    Tanggal Invoice *
                    <input
                      id="date"
                      name="date"
                      defaultValue={
                        invoiceToEdit == null
                          ? MomentTz().tz('Asia/Jakarta').format('YYYY-MM-DD')
                          : Moment(invoiceToEdit.date, 'DD/MM/YYYY').format(
                              'YYYY-MM-DD'
                            )
                      }
                      disabled={invoiceToEdit != null}
                      type="date"
                      ref={invoiceFormRegister({ required: true })}
                      placeholder="-"
                      className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        invoiceFormError.date ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                  <label htmlFor="tax">
                    Pajak *
                    <input
                      id="tax"
                      name="tax"
                      type="number"
                      defaultValue={
                        invoiceToEdit == null ? 0 : invoiceToEdit.tax
                      }
                      min="0"
                      ref={invoiceFormRegister({ required: true })}
                      placeholder="Rp. -"
                      className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        invoiceFormError.tax ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                </div>
              </div>
              <div className="totalBox font-display text-2xl bg-white px-4 py-2 mt-8 mb-10 md:mb-0 shadow-md">
                <span className="text-black">Total:</span>
                <span className="pl-3 text-gray-700 font-hairline">
                  {`Rp. ${
                    rowData.reduce((a, s) => {
                      // eslint-disable-next-line no-param-reassign
                      a += parseInt(s.harga, 10) * parseInt(s.jumlah, 10);
                      return a;
                    }, 0) + parseInt(tax, 10)
                  }`}
                </span>
              </div>
              <div className="totalBox font-display text-xl bg-white px-3 py-3 mt-8 mb-10 md:mb-0 shadow-md">
                <button
                  type="submit"
                  name="addInvoice"
                  className="block w-full bg-transparent hover:bg-blue-600 text-black font-semibold hover:text-white py-2 px-4 border border-black hover:border-transparent rounded"
                >
                  Simpan
                </button>
                {invoiceToEdit && (
                  <button
                    type="button"
                    onClick={() => dispatch(saveInvoice(invoiceToEdit.id))}
                    className="block w-full mt-3 bg-black hover:bg-blue-600 text-white font-semibold hover:text-white py-2 px-4 border border-black hover:border-transparent rounded"
                  >
                    Download PDF
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
