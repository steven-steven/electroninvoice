import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import ReactSelect from 'react-select';
import { useLocation, useHistory } from 'react-router-dom';
import Moment from 'moment';
import MomentTz from 'moment-timezone';
import routes from '../../constants/routes.json';
import EditableTable from '../../components/EditableTable';
import {
  addInvoiceCall,
  getInvoiceNumber,
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
import {
  getCustomer,
  Customer,
  selectCustomer,
} from '../customer/customerSlice';

import { AppDispatch, RootState } from '../../store';

interface LeftItemForm {
  transaksi: string;
  deskripsi: string;
  metric: string;
  metric_decimal: string;
  unit: string;
  jumlah: string;
  harga: string;
}
interface TableData {
  transaksi: string;
  deskripsi: string;
  isMetric: boolean;
  unit: string;
  jumlah: string;
  harga: string;
}
interface RightInvoiceForm {
  clientId: string;
  date: string;
  tax: string;
  catatankwitansi: string;
  catataninvoice: string;
  keteranganKwitansi: string;
  paid: boolean;
  // address
  addr_jln: string;
  addr_kota: string;
  addr_provinsi: string;
  addr_country: string;
  addr_postal: string;
}

export default function AddInvoicePage() {
  const currInvoiceStatus = useSelector(getInvoiceStatus);
  const currItemStatus = useSelector(getItemStatus);
  const items = useSelector(getItem);
  const customers = useSelector(getCustomer);
  const dispatch: AppDispatch = useDispatch();
  const history = useHistory();

  // form data
  const {
    register: itemFormRegister,
    handleSubmit: itemFormHandleSubmit,
    errors: itemFormError,
    reset: itemReset,
    setValue: setItemValue,
  } = useForm();
  const {
    register: invoiceFormRegister,
    handleSubmit: invoiceFormHandleSubmit,
    errors: invoiceFormError,
    watch: invoiceWatch,
    control: invoiceFormControl,
  } = useForm();
  const watchedDate = invoiceWatch('date');

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

  const sortedCustomerSelections = React.useMemo(
    () =>
      Object.values(customers)
        .sort((a, b) => (a.client > b.client ? 1 : -1))
        .map((cus: Customer) => ({
          value: cus.id,
          label: cus.client,
        })),
    [customers]
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
          jumlah: item.isMetric
            ? (item.quantity / 1000.0).toString()
            : item.quantity.toString(),
          isMetric: item.isMetric,
          unit: item.unit,
          harga: item.rate.toString(),
        };
      })
    : [];
  const [rowData, setRowData] = useState<TableData[]>(initialItems);
  const [originalData] = useState(rowData);
  const [selectedTransaction, setSelectedTransaction] = useState(''); // react-form-hook watcher doesn't seem to work for select
  const [selectedClient, setSelectedClient] = useState(''); // react-form-hook watcher doesn't seem to work for select
  const [isUnitMetric, setIsUnitMetric] = useState<boolean | null>(null); // react-form-hook watcher doesn't seem to work for select
  const [toggleAccordion, setToggleAccordion] = useState(false);
  const [skipPageReset, setSkipPageReset] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState<string>('');

  useEffect(() => {
    if (invoiceToEdit) {
      setInvoiceNo(invoiceToEdit.invoice_no);
      setSelectedClient(invoiceToEdit.customerId);
      return;
    }
    setRowData([]);
    // Using an IIFE. change invoice id based on date
    (async function anyNameFunction() {
      const newInvoiceNumber: number = await dispatch(
        getInvoiceNumber(Moment(watchedDate).format('YY'))
      );
      const paddedNo = String(newInvoiceNumber).padStart(5, '0');
      const newInvoiceNo = `${Moment(watchedDate).format('YYMM')}-${paddedNo}`;
      setInvoiceNo(newInvoiceNo);
    })();
  }, [watchedDate, invoiceToEdit, dispatch]);

  const addToRowData = (data: LeftItemForm) => {
    const chosenItem = items[data.transaksi];
    setRowData([
      ...rowData,
      {
        transaksi: chosenItem.name,
        deskripsi: data.deskripsi,
        jumlah: isUnitMetric
          ? `${data.metric.replace('.', '')}.${data.metric_decimal}`
          : data.jumlah,
        isMetric: isUnitMetric || false,
        unit: data.unit,
        harga: chosenItem.rate.toString(),
      },
    ]);
    itemReset();
    setIsUnitMetric(null);
    setSelectedTransaction('');
  };

  const submitInvoice = async (data: RightInvoiceForm) => {
    const newInvoice = {
      invoice_no: invoiceNo,
      customerId: selectedClient,
      date: Moment(data.date).format('DD/MM/YYYY'),
      items: rowData.map((item) => {
        const quantity = item.isMetric
          ? parseFloat(item.jumlah.trim().replace(',', '.'))
          : parseInt(item.jumlah, 10);
        return {
          name: item.transaksi,
          description: item.deskripsi,
          rate: parseInt(item.harga, 10),
          unit: item.unit,
          quantity: item.isMetric ? Math.round(quantity * 1000) : quantity,
          isMetric: item.isMetric,
          amount: Math.round(parseInt(item.harga, 10) * quantity),
        };
      }),
      catatanInvoice: data.catataninvoice,
      catatanKwitansi: data.catatankwitansi,
      keteranganKwitansi: data.keteranganKwitansi,
      tax: parseInt(data.tax, 10),
      paid: data.paid,
    };

    if (invoiceToEdit != null) {
      dispatch(updateInvoiceCall(invoiceToEdit.id, newInvoice));
    } else {
      dispatch(addInvoiceCall(newInvoice));
    }
    history.push(routes.INVOICE);
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
            Header: 'Barang',
            accessor: 'transaksi',
          },
          {
            Header: 'Deskripsi',
            accessor: 'deskripsi',
          },
          {
            Header: 'Jumlah',
            accessor: 'jumlah',
            width: 90,
          },
          {
            Header: 'Harga per unit',
            accessor: 'harga',
          },
          {
            Header: 'Decimal?',
            accessor: 'isMetric',
          },
          {
            Header: 'Unit',
            accessor: 'unit',
          },
        ],
      },
    ],
    []
  );

  const calculateTotal = (total: number, tax: number) =>
    Math.round(total + (tax / 100) * total).toLocaleString('id');

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
        <div className="flex flex-wrap-reverse justify-between p-6 pageContainer">
          <div className="flex flex-col w-full pr-0 leftBox md:pr-8 md:w-2/3">
            <div className="flex flex-col px-4 py-2 text-center text-gray-700 bg-white shadow-md AddItemBox">
              <form onSubmit={itemFormHandleSubmit(addToRowData)}>
                <div className="text-left formBox">
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
                      defaultValue={
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
                    Pilih Format Jumlah *
                    <select
                      className={`block mb-8 h-12 w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        itemFormError.selectUnit ? 'border-red-500' : ''
                      }`}
                      id="selectUnit"
                      name="selectUnit"
                      onChange={(e) => {
                        if (e.target.value === '1') {
                          setIsUnitMetric(true);
                          setItemValue('unit', 'm^2');
                        } else {
                          setIsUnitMetric(false);
                          setItemValue('unit', 'unit');
                        }
                      }}
                      ref={itemFormRegister({ required: true })}
                      defaultValue=""
                    >
                      <option disabled value="">
                        -- select format jumlah --
                      </option>
                      <option value="0">Jumlah satuan</option>
                      <option value="1">Decimal</option>
                    </select>
                  </label>
                  <label
                    htmlFor="unit"
                    className={isUnitMetric == null ? 'invisible' : 'visible'}
                  >
                    Unit Satuan
                    <p className="text-sm">
                      Jenis satuan yang tertulis disebelah nomor jumlah.
                    </p>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <input
                        id="unit"
                        name="unit"
                        type="text"
                        ref={itemFormRegister}
                        className={`w-full mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                          invoiceFormError.invoiceNo ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                  </label>
                  {isUnitMetric === false && (
                    <label htmlFor="jumlah">
                      Jumlah Satuan *
                      <p className="text-sm">
                        Isi 0 jika item tidak memiliki jumlah
                      </p>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-600">#</span>
                        </div>
                        <input
                          id="jumlah"
                          name="jumlah"
                          min="0"
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
                      Jumlah dalam decimal *
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
                          <span className="pr-1 text-lg text-gray-800 pointer-events-none">
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
                    className="float-right w-auto px-4 py-2 mb-3 font-semibold text-black bg-transparent border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                  >
                    Tambah
                  </button>
                </div>
              </form>
            </div>
            <div className="flex flex-col p-3 mt-8 text-center text-gray-700 bg-white rounded-lg shadow-md tableBox">
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
                  className="float-right w-auto px-4 py-1 mt-5 text-xs text-gray-800 border border-gray-400 rounded hover:bg-gray-100"
                  type="button"
                  onClick={resetData}
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full rightBox md:w-1/3">
            <form onSubmit={invoiceFormHandleSubmit(submitInvoice)}>
              <div
                className={`flex flex-col px-4 py-2 text-center text-gray-700 ${
                  invoiceToEdit ? 'bg-blue-200' : 'bg-white'
                } shadow-md invoiceInfoBox`}
              >
                <div className="mt-4 mb-6 text-2xl">
                  {invoiceToEdit == null
                    ? 'Invoice Baru'
                    : `Edit invoice #${invoiceToEdit.invoice_no}`}
                </div>
                <div className="text-left formBox">
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label htmlFor="clientId">
                    Nama Client *
                    <div
                      className={`block mb-8 w-full bg-gray-200 border border-gray-200 px-1 py-1 ${
                        invoiceFormError.clientId ? 'border-red-500' : ''
                      }`}
                    >
                      <Controller
                        rules={{ required: true }}
                        name="clientId"
                        control={invoiceFormControl}
                        defaultValue={
                          invoiceToEdit == null ? '' : invoiceToEdit.customerId
                        }
                        render={({ ref, name, value, onChange }) => (
                          <>
                            <ReactSelect
                              isClearable
                              isSearchable
                              id="clientId"
                              name={name}
                              ref={ref}
                              options={sortedCustomerSelections}
                              onChange={(e: { value: string }) => {
                                onChange(e.value);
                                setSelectedClient(e.value);
                              }}
                              value={sortedCustomerSelections.find(
                                (c) => c.value === value
                              )}
                            />
                          </>
                        )}
                      />
                    </div>
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
                  <label htmlFor="date">
                    Nomor Invoice *
                    <input
                      id="invoiceNo"
                      name="invoiceNo"
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      ref={invoiceFormRegister({
                        required: true,
                        pattern: {
                          value: /^[0-9]{4}-[0-9]{5}$/i,
                          message: 'invalid invoice No',
                        },
                      })}
                      className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        invoiceFormError.invoiceNo ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                  <label htmlFor="keteranganKwitansi">
                    Keterangan pembelian di Kwitansi
                    <textarea
                      id="keteranganKwitansi"
                      name="keteranganKwitansi"
                      ref={invoiceFormRegister}
                      rows={1}
                      placeholder="contoh: 'barang1, barang2'"
                      defaultValue={
                        invoiceToEdit == null
                          ? ''
                          : invoiceToEdit.keteranganKwitansi
                      }
                      className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                        itemFormError.keteranganKwitansi ? 'border-red-500' : ''
                      }`}
                    />
                  </label>
                  <label
                    htmlFor="paid"
                    className="inline-flex items-center px-3 mb-3 bg-teal-200"
                  >
                    <input
                      id="paid"
                      name="paid"
                      type="checkbox"
                      ref={invoiceFormRegister}
                      className="w-10 h-10"
                      defaultChecked={invoiceToEdit?.paid || false}
                    />
                    <span>Lunas</span>
                  </label>
                  {
                    // ADDRESS FORM
                  }
                  <button
                    type="button"
                    className="flex flex-row items-center w-full p-2 mb-6 text-left border cursor-pointer"
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
              <div className="px-4 py-2 mt-8 mb-10 text-2xl bg-white shadow-md totalBox font-display md:mb-0">
                <span className="text-black">Total:</span>
                <span className="pl-3 font-hairline text-gray-700">
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
              <div className="px-3 py-3 mt-8 mb-10 text-xl bg-white shadow-md totalBox font-display md:mb-0">
                <button
                  type="submit"
                  name="addInvoice"
                  className="block w-full px-4 py-2 font-semibold text-black bg-transparent border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                >
                  Simpan
                </button>
                {invoiceToEdit && (
                  <button
                    type="button"
                    onClick={() => dispatch(downloadInvoice(invoiceToEdit.id))}
                    className="block w-full px-4 py-2 mt-3 font-semibold text-white bg-black border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                  >
                    Download PDF
                  </button>
                )}
                {invoiceToEdit && (
                  <button
                    type="button"
                    // eslint-disable-next-line prettier/prettier
                    onClick={() => dispatch(downloadInvoice(invoiceToEdit.id, true))}
                    className="block w-full px-4 py-2 mt-3 font-semibold text-white bg-black border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                  >
                    Download Kwitansi
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
