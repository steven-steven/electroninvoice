import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { CellProps } from 'react-table';
import MyTable from '../../components/MyTable';
import {
  Item,
  getStatus,
  getItem,
  status as itemStatus,
  deleteItemCall,
  ItemRequest,
  addItemCall,
  getIsSynced,
} from './daftarBarangSlice';
import { getIsConnected } from '../connection/connectionSlice';

interface TableCells {
  nameCol: string;
  descriptionCol: string;
  rateCol: string;
  itemId: string;
}

export default function InvoicePage() {
  const status = useSelector(getStatus);
  const items = useSelector(getItem);
  const isConnected = useSelector(getIsConnected);
  const isSynced = useSelector(getIsSynced);
  const dispatch = useDispatch();

  const {
    register: itemFormRegister,
    handleSubmit: itemFormHandleSubmit,
    errors: itemFormError,
  } = useForm();

  const submitItem = (data: TableCells) => {
    const newItem: ItemRequest = {
      name: data.nameCol,
      defaultDesc: data.descriptionCol,
      rate: parseInt(data.rateCol, 10),
    };
    dispatch(addItemCall(newItem));
  };

  const data = React.useMemo(
    () =>
      Object.values(items).map((item) => {
        return {
          nameCol: item.name,
          descriptionCol: item.defaultDesc,
          rateCol: item.rate.toLocaleString('id'),
          itemId: item.id,
        };
      }),
    [items]
  );

  const columns = React.useMemo(
    () => [
      {
        Header: 'Nama',
        id: 'sortableCol',
        accessor: 'nameCol',
      },
      {
        Header: 'Harga Satuan',
        accessor: 'rateCol',
      },
      {
        Header: 'Deskripsi',
        accessor: 'descriptionCol',
        disableSortBy: true,
      },
      {
        Header: 'Delete',
        id: 'delete',
        // eslint-disable-next-line react/display-name
        Cell: ({ row }: CellProps<TableCells>) => {
          return (
            <button
              type="button"
              onClick={() => dispatch(deleteItemCall(row.original.itemId))}
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
    <div className="pageContainer p-6 flex justify-between flex-wrap-reverse">
      <div className="leftBox flex flex-col pr-0 md:pr-8 w-full md:w-2/3">
        {status === itemStatus.LOADING ? (
          <div className="text-center">
            <i className="fa fa-spinner fa-pulse fa-3x fa-fw" />
          </div>
        ) : (
          <div className="tableBox flex flex-col text-center text-gray-700 bg-white shadow-md rounded-lg p-3">
            <span className="text-left text-2xl ml-5 mb-3 font-display font-light">
              Daftar Barang
            </span>
            <MyTable columns={columns} data={data} />
          </div>
        )}
      </div>
      <div className="rightBox flex flex-col w-full md:w-1/3">
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
        <div className="invoiceInfoBox flex flex-col text-center text-gray-700 bg-white px-4 py-2 shadow-md">
          <div className="text-2xl mb-6 mt-4">Tambah Barang/Jasa</div>
          <form onSubmit={itemFormHandleSubmit(submitItem)}>
            <div className="formBox text-left">
              <label htmlFor="itemName">
                Nama Barang/Jasa *
                <input
                  id="itemName"
                  name="nameCol"
                  type="text"
                  ref={itemFormRegister({ required: true })}
                  className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                    itemFormError.nameCol ? 'border-red-500' : ''
                  }`}
                />
              </label>
              <label htmlFor="harga">
                Harga Satuan/meteran *
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-600">Rp. </span>
                  </div>
                  <input
                    id="harga"
                    name="rateCol"
                    type="number"
                    defaultValue={0}
                    min="0"
                    ref={itemFormRegister({ required: true })}
                    className={`w-full pl-12 mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                      itemFormError.tax ? 'border-red-500' : ''
                    }`}
                  />
                </div>
              </label>
              <label htmlFor="deskripsi">
                Deskripsi Barang
                <textarea
                  id="deskripsi"
                  name="descriptionCol"
                  rows={1}
                  ref={itemFormRegister()}
                  className={`w-full mb-8 block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 ${
                    itemFormError.descriptionCol ? 'border-red-500' : ''
                  }`}
                />
              </label>
            </div>
            <div className="actionBox mt-12">
              <button
                type="submit"
                name="addInvoice"
                className="block w-full mb-3 bg-transparent hover:bg-blue-600 text-black font-semibold hover:text-white py-2 px-4 border border-black hover:border-transparent rounded"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
