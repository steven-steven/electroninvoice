/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useTable, TableInstance, TableOptions } from 'react-table';
import PropTypes from 'prop-types';

export default function MyTable({
  columns,
  data,
}: TableOptions<Record<string, unknown>>): JSX.Element {
  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
  }: TableInstance = useTable({
    columns,
    data,
  });

  return (
    <table {...getTableProps()} className="border-2 border-blue-500">
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                {...column.getHeaderProps()}
                className="border-b-2 border-red-500 bg-blue-200 font-bold"
              >
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
                  <td
                    {...cell.getCellProps()}
                    className="border-b-2 bg-orange-200 p-6"
                  >
                    {cell.render('Cell')}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

MyTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
