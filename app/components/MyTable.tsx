/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useTable, TableInstance, TableOptions, useSortBy } from 'react-table';
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
  }: TableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        // @ts-ignore
        sortBy: [
          {
            id: 'sortableCol',
            desc: true,
          },
        ],
      },
    },
    useSortBy
  );

  return (
    <table {...getTableProps()} className="table-fixed w-full">
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                // @ts-ignore
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className={`pb-2 font-display font-light ${
                  // @ts-ignore
                  column.collapse ? 'w-1/12' : 'w-auto'
                }`}
              >
                {column.render('Header')}
                <span>
                  {/* @ts-ignore */}
                  {column.isSorted &&
                    // @ts-ignore
                    (column.isSortedDesc ? (
                      <i className="fas fa-chevron-down fa-sm" />
                    ) : (
                      <i className="fas fa-chevron-up fa-sm" />
                    ))}
                </span>
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
                    className={`border-t leading-normal p-3 ${
                      // @ts-ignore
                      cell.column.collapse ? 'w-1/12' : 'w-auto'
                    }`}
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
