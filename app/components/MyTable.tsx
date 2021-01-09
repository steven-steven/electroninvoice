/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/jsx-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  useTable,
  TableInstance,
  TableOptions,
  useSortBy,
  usePagination,
} from 'react-table';
import PropTypes from 'prop-types';

export default function MyTable({
  columns,
  data,
  useControlledState,
}: TableOptions<Record<string, unknown>>): JSX.Element {
  const {
    getTableProps,
    headerGroups,
    page, // instead of 'rows'
    prepareRow,

    // pagination
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  }: TableInstance = useTable(
    {
      columns,
      data,
      useControlledState,
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
    useSortBy,
    usePagination
  );

  return (
    <>
      <table
        {...getTableProps()}
        className="relative justify-start flex-auto w-full h-5 overflow-y-auto table-fixed"
      >
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  // @ts-ignore
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={`pb-2 font-display font-light min-h-5 ${
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
          {page.map((row, i) => {
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

      <div className="flex flex-row justify-between px-3 pt-3 border-t-4 pagination">
        <div className="flex flex-col mb-2">
          <div className="mb-2">
            <button
              type="button"
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className={`mr-2 px-3 py-2 text-sm leading-4 rounded-md shadow-sm ${
                !canPreviousPage
                  ? 'bg-white cursor-not-allowed'
                  : 'border border-gray-500 bg-white hover:bg-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {'<<'}
            </button>
            <button
              type="button"
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className={`mr-2 px-3 py-2 text-sm leading-4 rounded-md shadow-sm ${
                !canPreviousPage
                  ? 'bg-white cursor-not-allowed'
                  : 'border border-gray-500 bg-white hover:bg-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {'<'}
            </button>
            <button
              type="button"
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className={`mr-2 px-3 py-2 text-sm leading-4 rounded-md shadow-sm ${
                !canNextPage
                  ? 'bg-white cursor-not-allowed'
                  : 'border border-gray-500 bg-white hover:bg-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {'>'}
            </button>
            <button
              type="button"
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              className={`mr-2 px-3 py-2 text-sm leading-4 rounded-md shadow-sm ${
                !canNextPage
                  ? 'bg-white cursor-not-allowed'
                  : 'border border-gray-500 bg-white hover:bg-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {'>>'}
            </button>
          </div>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
            className="h-6 text-sm border border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {[10, 20, 30, 40, 50].map((pageSizeOption) => (
              <option key={pageSizeOption} value={pageSizeOption}>
                {`Lihat ${pageSizeOption}`}
              </option>
            ))}
          </select>
        </div>
        <span>
          Halaman&nbsp;
          <strong>{`${pageIndex + 1} of ${pageOptions.length}`}</strong>
        </span>
      </div>
    </>
  );
}

MyTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
};
