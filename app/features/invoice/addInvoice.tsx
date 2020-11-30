import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useLocation, useHistory } from 'react-router-dom';
import Moment from 'moment';
import MomentTz from 'moment-timezone';
import routes from '../../constants/routes.json';
import EditableTable from '../../components/EditableTable';
import {
  addInvoiceCall,
  updateInvoiceCall,
  getStatus as getInvoiceStatus,
  InvoiceRequest,
  downloadInvoice,
  status as invoiceStatus,
} from './invoiceSlice';
import {
  getStatus as getItemStatus,
  getItem,
  status as itemStatus,
} from '../daftarBarang/daftarBarangSlice';

import { RootState } from '../../store';

interface LeftItemForm {
  transaksi: string;
  deskripsi: string;
  metric: string;
  metric_decimal: string;
  jumlah: string;
  harga: string;
}
interface TableData {
  transaksi: string;
  deskripsi: string;
  isMetric: string;
  jumlah: string;
  harga: string;
}
interface RightInvoiceForm {
  clientName: string;
  date: string;
  tax: string;
  catatankwitansi: string;
  catataninvoice: string;
  // address
  addr_jln: string;
  addr_kota: string;
  addr_provinsi: string;
  addr_country: string;
  addr_postal: string;
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
        const isUnitMetric = item.metricQuantity && item.metricQuantity > 0;
        return {
          transaksi: item.name,
          deskripsi: item.description,
          jumlah: isUnitMetric
            ? (item.metricQuantity / 1000.0).toString()
            : item.quantity.toString(),
          isMetric: isUnitMetric ? '1' : '0',
          harga: item.rate.toString(),
        };
      })
    : [];
  const [rowData, setRowData] = useState<TableData[]>(initialItems);
  const [originalData] = useState(rowData);
  const [selectedTransaction, setSelectedTransaction] = useState(''); // react-form-hook watcher doesn't seem to work for select
  const [isUnitMetric, setIsUnitMetric] = useState<boolean | null>(null); // react-form-hook watcher doesn't seem to work for select
  const [toggleAccordion, setToggleAccordion] = useState(false);
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

  const addToRowData = (data: LeftItemForm) => {
    const chosenItem = items[data.transaksi];
    setRowData([
      ...rowData,
      {
        transaksi: chosenItem.name,
        deskripsi: data.deskripsi || chosenItem.defaultDesc,
        jumlah: isUnitMetric
          ? `${data.metric.replace('.', '')}.${data.metric_decimal}`
          : data.jumlah,
        isMetric: isUnitMetric ? '1' : '0',
        harga: chosenItem.rate.toString(),
      },
    ]);
    itemReset();
    setIsUnitMetric(null);
    setSelectedTransaction('');
  };

  const submitInvoice = (data: RightInvoiceForm) => {
    const newInvoice: InvoiceRequest = {
      client: data.clientName,
      client_address: {
        address: data.addr_jln,
        city: data.addr_kota,
        state: data.addr_provinsi,
        country: data.addr_country,
        postal_code: data.addr_postal,
      },
      date: Moment(data.date).format('DD/MM/YYYY'),
      items: rowData.map((item) => {
        const isMetric = item.isMetric === '1';
        const quantity = isMetric
          ? parseFloat(item.jumlah.trim().replace(',', '.'))
          : parseInt(item.jumlah, 10);
        return {
          name: item.transaksi,
          description: item.deskripsi,
          rate: parseInt(item.harga, 10),
          metricQuantity: isMetric ? Math.round(quantity * 1000) : 0,
          quantity: isMetric ? 0 : quantity,
          amount: Math.round(parseInt(item.harga, 10) * quantity),
        };
      }),
      catatanInvoice: data.catataninvoice,
      catatanKwitansi: data.catatankwitansi,
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
          {
            Header: 'Unit',
            accessor: 'isMetric',
          },
        ],
      },
    ],
    []
  );

  const calculateTotal = (total: number, tax: number) =>
    Math.round(total + (tax / 100) * total);

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
                  <label htmlFor="deskripsi">
                    Deskripsi
                    <textarea
                      id="deskripsi"
                      name="deskripsi"
                      ref={itemFormRegister}
                      rows={1}
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
                  <label htmlFor="selectUnit">
                    Pilih Unit
                    <select
                      className={`block mb-3 h-12 w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        itemFormError.selectUnit ? 'border-red-500' : ''
                      }`}
                      id="selectUnit"
                      name="selectUnit"
                      onChange={(e) => {
                        setIsUnitMetric(e.target.value === '1');
                      }}
                      ref={itemFormRegister({ required: true })}
                      defaultValue=""
                    >
                      <option disabled value="">
                        -- select Unit --
                      </option>
                      <option value="1">metric</option>
                      <option value="0">jumlah unit</option>
                    </select>
                  </label>
                  {isUnitMetric === false && (
                    <label htmlFor="jumlah">
                      Jumlah (unit)*
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">#</span>
                        </div>
                        <input
                          id="jumlah"
                          name="jumlah"
                          min="1"
                          ref={itemFormRegister({ required: true })}
                          type="number"
                          className={`w-full pl-8 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            itemFormError.jumlah ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                    </label>
                  )}
                  {isUnitMetric && (
                    <label htmlFor="metric">
                      Metric *
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">
                            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                            m<sup>2</sup>
                          </span>
                        </div>
                        <input
                          id="metric"
                          name="metric"
                          min="0"
                          step="any"
                          ref={itemFormRegister({ required: true })}
                          type="number"
                          className={`w-full pl-10 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            itemFormError.metric ? 'border-red-500' : ''
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <span className="text-lg pr-1 text-gray-800 pointer-events-none">
                            ,
                          </span>
                          <input
                            id="metric_decimal"
                            name="metric_decimal"
                            min="0"
                            defaultValue="0"
                            ref={itemFormRegister()}
                            type="number"
                            className={`w-20 pl-2 border-transparent bg-transparent text-gray-700 border rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                              itemFormError.metric_decimal
                                ? 'border-red-500'
                                : ''
                            }`}
                          />
                        </div>
                      </div>
                    </label>
                  )}
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
                  {
                    // ADDRESS FORM
                  }
                  <button
                    type="button"
                    className="mb-6 p-2 flex flex-row items-center text-left w-full border cursor-pointer"
                    onClick={() => setToggleAccordion(!toggleAccordion)}
                  >
                    <span className="flex-grow">Lihat Lebih :</span>
                    <i
                      className={`p-1 mr-2 border rounded-full text-right fas fa-md ${
                        toggleAccordion ? 'fa-chevron-up' : 'fa-chevron-down'
                      }`}
                    />
                  </button>
                  <div className={`${toggleAccordion ? '' : 'hidden'}`}>
                    <label htmlFor="noAlamat">
                      Alamat Customer
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">Jln: </span>
                        </div>
                        <input
                          id="addr_jln"
                          name="addr_jln"
                          type="text"
                          defaultValue={
                            invoiceToEdit != null &&
                            invoiceToEdit.client_address
                              ? invoiceToEdit.client_address.address
                              : ''
                          }
                          ref={invoiceFormRegister()}
                          className={`w-full pl-12 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            invoiceFormError.addr_jln ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">Kota: </span>
                        </div>
                        <input
                          id="addr_kota"
                          name="addr_kota"
                          type="text"
                          defaultValue={
                            invoiceToEdit != null &&
                            invoiceToEdit.client_address
                              ? invoiceToEdit.client_address.city
                              : ''
                          }
                          ref={invoiceFormRegister()}
                          className={`w-full pl-16 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            invoiceFormError.addr_kota ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">Kode Pos: </span>
                        </div>
                        <input
                          id="addr_postal"
                          name="addr_postal"
                          type="text"
                          defaultValue={
                            invoiceToEdit != null &&
                            invoiceToEdit.client_address
                              ? invoiceToEdit.client_address.postal_code
                              : ''
                          }
                          ref={invoiceFormRegister()}
                          className={`w-full pl-24 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            invoiceFormError.addr_postal ? 'border-red-500' : ''
                          }`}
                        />
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">Provinsi: </span>
                        </div>
                        <input
                          id="addr_provinsi"
                          name="addr_provinsi"
                          type="text"
                          defaultValue={
                            invoiceToEdit != null &&
                            invoiceToEdit.client_address
                              ? invoiceToEdit.client_address.state
                              : ''
                          }
                          ref={invoiceFormRegister()}
                          className={`w-full pl-20 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            invoiceFormError.addr_provinsi
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                      </div>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-600">Negara: </span>
                        </div>
                        <input
                          id="addr_country"
                          name="addr_country"
                          placeholder="Indonesia"
                          type="text"
                          defaultValue={
                            invoiceToEdit != null &&
                            invoiceToEdit.client_address
                              ? invoiceToEdit.client_address.country
                              : ''
                          }
                          ref={invoiceFormRegister()}
                          className={`w-full pl-20 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                            invoiceFormError.addr_country
                              ? 'border-red-500'
                              : ''
                          }`}
                        />
                      </div>
                    </label>

                    {
                      // ADDRESS FORM END
                    }

                    <label htmlFor="tax">
                      Pajak (%) *
                      <input
                        id="tax"
                        name="tax"
                        type="number"
                        defaultValue={
                          invoiceToEdit == null ? 10 : invoiceToEdit.tax
                        }
                        min="0"
                        ref={invoiceFormRegister({ required: true })}
                        placeholder="Rp. -"
                        className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                          invoiceFormError.tax ? 'border-red-500' : ''
                        }`}
                      />
                    </label>
                    <label htmlFor="catataninvoice">
                      Catatan Invoice
                      <textarea
                        id="catataninvoice"
                        name="catataninvoice"
                        ref={invoiceFormRegister}
                        rows={1}
                        defaultValue={
                          invoiceToEdit == null
                            ? 'Pembayaran : Cheque/Giro/Transfer dianggap syah jika sudah aktif pada rekening kami'
                            : invoiceToEdit.catatanInvoice
                        }
                        className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                          itemFormError.catataninvoice ? 'border-red-500' : ''
                        }`}
                      />
                    </label>
                    <label htmlFor="catatankwitansi">
                      Catatan Kwitansi
                      <textarea
                        id="catatankwitansi"
                        name="catatankwitansi"
                        ref={invoiceFormRegister}
                        rows={1}
                        defaultValue={
                          invoiceToEdit == null
                            ? 'Pembayaran : Cheque/Giro/Transfer ditujukan kepada: AN; PT. Dwiprima Karyaguna, Ac: 116.00.04682.26.7, Bank Mandiri Cilegon'
                            : invoiceToEdit.catatanKwitansi
                        }
                        className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                          itemFormError.catatankwitansi ? 'border-red-500' : ''
                        }`}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="totalBox font-display text-2xl bg-white px-4 py-2 mt-8 mb-10 md:mb-0 shadow-md">
                <span className="text-black">Total:</span>
                <span className="pl-3 text-gray-700 font-hairline">
                  {`Rp. ${calculateTotal(
                    rowData.reduce((a, s) => {
                      const quantity = s.isMetric
                        ? parseFloat(s.jumlah.trim().replace(',', '.'))
                        : parseInt(s.jumlah, 10);
                      // eslint-disable-next-line no-param-reassign
                      a += parseInt(s.harga, 10) * quantity;
                      return a;
                    }, 0.0),
                    parseInt(tax, 10)
                  )}`}
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
                    onClick={() => dispatch(downloadInvoice(invoiceToEdit.id))}
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
