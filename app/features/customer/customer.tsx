import React, { useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { CellProps } from 'react-table';
import MyTable from '../../components/MyTable';
import {
  deleteCustomerCall,
  getCustomer,
  getStatus,
  selectCustomer,
  deselectCustomer,
  getSelectedCustomer,
  getIsSynced,
  status as customerStatus,
  addCustomerCall,
  CustomerRequest,
  updateCustomerCall,
} from './customerSlice';
import { getIsConnected } from '../connection/connectionSlice';

interface TableCells {
  customerId: string;
  clientName: string;
  phone: string;
  // address
  addr_jln: string;
  addr_kota: string;
  addr_provinsi: string;
  addr_country: string;
  addr_postal: string;
}

export default function CustomerPage() {
  const status = useSelector(getStatus);
  const customers = useSelector(getCustomer);
  const isConnected = useSelector(getIsConnected);
  const customerToEdit = useSelector(getSelectedCustomer);
  const isSynced = useSelector(getIsSynced);
  const dispatch = useDispatch();

  const {
    register: customerFormRegister,
    handleSubmit: customerFormHandleSubmit,
    errors: customerFormError,
    setValue: customerSetValue,
    reset: customerReset,
  } = useForm();

  useEffect(() => {
    if (customerToEdit) {
      customerSetValue('customerId', customerToEdit.id);
      customerSetValue('clientName', customerToEdit.client);
      customerSetValue('addr_jln', customerToEdit.client_address?.address);
      customerSetValue('addr_kota', customerToEdit.client_address?.city);
      customerSetValue('addr_provinsi', customerToEdit.client_address?.state);
      customerSetValue('addr_country', customerToEdit.client_address?.country);
      customerSetValue(
        'addr_postal',
        customerToEdit.client_address?.postal_code
      );
      customerSetValue('phone', customerToEdit.phone);
    } else {
      customerReset();
    }
  }, [customerReset, customerSetValue, customerToEdit]);

  const submitCustomer = (data: TableCells) => {
    const newCustomer: CustomerRequest = {
      client: data.clientName,
      phone: data.phone,
      client_address: {
        address: data.addr_jln,
        city: data.addr_kota,
        state: data.addr_provinsi,
        country: data.addr_country,
        postal_code: data.addr_postal,
      },
    };
    if (customerToEdit != null) {
      dispatch(updateCustomerCall(customerToEdit.id, newCustomer));
    } else {
      dispatch(addCustomerCall(newCustomer));
    }
  };

  const data = React.useMemo(
    () =>
      Object.values(customers).map((customer) => {
        return {
          nameCol: customer.client,
          addressCol: customer.client_address?.address,
          customerId: customer.id,
        };
      }),
    [customers]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        id: 'sortableCol',
        accessor: 'nameCol',
      },
      {
        Header: 'Alamat',
        accessor: 'addressCol',
      },
      {
        Header: 'Detail',
        id: 'select',
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<TableCells>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(selectCustomer(row.original.customerId))}
            >
              Pilih
            </button>
          );
        },
      },
    ],
    [dispatch]
  );

  // ------ handle outside click events to cancel edit
  const editWindow = useRef<HTMLDivElement>(null);

  const handleClickOutsideEditWindow = useCallback(
    (e) => {
      if (!customerToEdit || !editWindow || !editWindow.current) return;
      if (!editWindow.current.contains(e.target)) {
        dispatch(deselectCustomer());
      }
    },
    [customerToEdit, dispatch]
  );

  useLayoutEffect(() => {
    document.addEventListener('mousedown', handleClickOutsideEditWindow);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEditWindow);
    };
  }, [handleClickOutsideEditWindow]);

  // --------

  return (
    <div className="flex flex-wrap-reverse justify-between p-6 pageContainer">
      <div className="flex flex-col w-full pr-0 leftBox md:pr-8 md:w-2/3">
        {status === customerStatus.LOADING ? (
          <div className="text-center">
            <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
          </div>
        ) : (
          <div className="flex flex-col p-3 text-center text-gray-700 bg-white rounded-lg shadow-md tableBox">
            <span className="mb-3 ml-5 text-2xl font-light text-left font-display">
              Daftar Customer
            </span>
            <MyTable columns={columns} data={data} />
          </div>
        )}
      </div>
      <div className="flex flex-col w-full rightBox md:w-1/3">
        <div className="text-gray-700">
          <p className="text-xs">
            Status:&nbsp;
            {isSynced ? '✅ tersimpan' : '❌'}
          </p>
          <p className="text-xs">
            Internet:&nbsp;
            {isConnected ? '✅ terhubung' : '❌ terputus'}
          </p>
        </div>
        <div
          ref={editWindow}
          className={`flex flex-col px-4 py-2 text-center text-gray-700 ${
            customerToEdit ? 'bg-blue-200' : 'bg-white'
          } shadow-md invoiceInfoBox`}
        >
          <div className="mt-4 mb-6 text-2xl">
            {customerToEdit == null
              ? 'Tambah Customer Baru'
              : `Edit Customer: "${customerToEdit.client}"`}
          </div>
          <form onSubmit={customerFormHandleSubmit(submitCustomer)}>
            <div className="text-left formBox">
              <label htmlFor="clientName">
                Nama Client *
                <input
                  id="clientName"
                  name="clientName"
                  type="text"
                  ref={customerFormRegister({ required: true })}
                  className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                    customerFormError.clientName ? 'border-red-500' : ''
                  }`}
                />
              </label>
              <label htmlFor="phone">
                No. Telp
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Rp. </span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.address
                        : ''
                    }
                    min="0"
                    ref={customerFormRegister({ required: true })}
                    className={`w-full pl-12 mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.phone ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </label>
              <label htmlFor="noAlamat">
                Alamat Customer
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Jln: </span>
                  </div>
                  <input
                    id="addr_jln"
                    name="addr_jln"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.address
                        : ''
                    }
                    ref={customerFormRegister()}
                    className={`w-full pl-12 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.addr_jln ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Kota: </span>
                  </div>
                  <input
                    id="addr_kota"
                    name="addr_kota"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.city
                        : ''
                    }
                    ref={customerFormRegister()}
                    className={`w-full pl-16 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.addr_kota ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Kode Pos: </span>
                  </div>
                  <input
                    id="addr_postal"
                    name="addr_postal"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.postal_code
                        : ''
                    }
                    ref={customerFormRegister()}
                    className={`w-full pl-24 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.addr_postal ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Provinsi: </span>
                  </div>
                  <input
                    id="addr_provinsi"
                    name="addr_provinsi"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.state
                        : ''
                    }
                    ref={customerFormRegister()}
                    className={`w-full pl-20 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.addr_provinsi ? 'border-red-500' : ''
                    }`}
                  />
                </div>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-600">Negara: </span>
                  </div>
                  <input
                    id="addr_country"
                    name="addr_country"
                    placeholder="Indonesia"
                    type="text"
                    defaultValue={
                      customerToEdit != null && customerToEdit.client_address
                        ? customerToEdit.client_address.country
                        : ''
                    }
                    ref={customerFormRegister()}
                    className={`w-full pl-20 mb-3 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      customerFormError.addr_country ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </label>
              {
                // ADDRESS FORM END
              }
            </div>
            <div className="mt-12 actionBox">
              {customerToEdit ? (
                <>
                  <button
                    type="submit"
                    name="editCustomer"
                    className="block w-full px-4 py-2 mb-3 font-semibold text-black bg-transparent bg-blue-200 border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    name="hapusCustomer"
                    onClick={() => {
                      dispatch(deleteCustomerCall(customerToEdit.id));
                    }}
                    className="block w-full px-4 py-2 mb-3 font-semibold text-black bg-transparent bg-red-200 border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                  >
                    Hapus
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  name="tambahCustomer"
                  className="block w-full px-4 py-2 mb-3 font-semibold text-black bg-transparent bg-white border border-black rounded hover:bg-blue-600 hover:text-white hover:border-transparent"
                >
                  Tambah
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
