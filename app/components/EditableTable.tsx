/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-key */
import React, { useState, useEffect } from 'react';
import { useTable, TableOptions, TableInstance, Cell } from 'react-table';

interface EditableCell extends Cell {
  updateMyData: (
    rowIndex: number,
    columnId: string,
    value: string | number
  ) => void;
}

const EditableCell = ({
  value: initialValue,
  row: { index },
  column: { id },
  updateMyData, // custom function
}: EditableCell): JSX.Element => {
  const [value, setValue] = useState(initialValue);
  const onChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setValue(e.target.value);
  };
  // only update data when input is blurred
  const onBlur = () => {
    updateMyData(index, id, value);
  };
  // change view if initialValue changed externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  if (id === 'deskripsi') {
    return (
      <textarea
        className="w-full break-words p-2 focus:outline-none focus:shadow-outline border border-gray-300 rounded-md appearance-none leading-normal"
        style={{ marginTop: '0.4rem' }}
        rows={1}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }
  if (id === 'isMetric') {
    return (
      <select
        className="w-full h-10 p-2 focus:outline-none focus:shadow-outline border border-gray-300 rounded leading-tight"
        required
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      >
        <option value="1">metric</option>
        <option value="0">satuan</option>
      </select>
    );
  }
  if (id === 'jumlah' || id === 'harga') {
    return (
      <input
        required
        min="1"
        step="any"
        type="number"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full break-words p-2 focus:outline-none focus:shadow-outline border border-gray-300 rounded-md appearance-none leading-normal"
      />
    );
  }

  return (
    <input
      className="w-full break-words p-2 focus:outline-none focus:shadow-outline border border-gray-300 rounded-md appearance-none leading-normal"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
};

const defaultColumn = {
  Cell: EditableCell,
};

interface MyTableOptions extends TableOptions<Record<string, unknown>> {
  updateMyData: (
    rowIndex: number,
    columnId: string,
    value: string | number
  ) => void;
  skipPageReset: boolean;
}

export default function MyTable({
  columns,
  data,
  updateMyData,
  skipPageReset,
}: MyTableOptions): JSX.Element {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  }: TableInstance = useTable({
    columns,
    data,
    defaultColumn,
    // use the skipPageReset option to disable page resetting temporarily
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    autoResetPage: !skipPageReset,
    updateMyData,
  });

  return (
    <div>
      <table {...getTableProps()} className="table-fixed w-full">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} className="pb-2 font-light">
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()} className="">
                      {cell.render('Cell')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
