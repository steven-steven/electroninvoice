/* eslint-disable @typescript-eslint/ban-ts-comment */
// from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-table#example-type-file

import {
  UseColumnOrderInstanceProps,
  UseColumnOrderState,
  UseExpandedHooks,
  UseExpandedInstanceProps,
  UseExpandedOptions,
  UseExpandedRowProps,
  UseExpandedState,
  UseFiltersColumnOptions,
  UseFiltersColumnProps,
  UseFiltersInstanceProps,
  UseFiltersOptions,
  UseFiltersState,
  UseGlobalFiltersColumnOptions,
  UseGlobalFiltersInstanceProps,
  UseGlobalFiltersOptions,
  UseGlobalFiltersState,
  UseGroupByCellProps,
  UseGroupByColumnOptions,
  UseGroupByColumnProps,
  UseGroupByHooks,
  UseGroupByInstanceProps,
  UseGroupByOptions,
  UseGroupByRowProps,
  UseGroupByState,
  UsePaginationInstanceProps,
  UsePaginationOptions,
  UsePaginationState,
  UseResizeColumnsColumnOptions,
  UseResizeColumnsColumnProps,
  UseResizeColumnsOptions,
  UseResizeColumnsState,
  UseRowSelectHooks,
  UseRowSelectInstanceProps,
  UseRowSelectOptions,
  UseRowSelectRowProps,
  UseRowSelectState,
  UseRowStateCellProps,
  UseRowStateInstanceProps,
  UseRowStateOptions,
  UseRowStateRowProps,
  UseRowStateState,
  UseSortByColumnOptions,
  UseSortByColumnProps,
  UseSortByHooks,
  UseSortByInstanceProps,
  UseSortByOptions,
  UseSortByState,
} from 'react-table';

declare module 'react-table' {
  // take this file as-is, or comment out the sections that don't apply to your plugin configuration

  // @ts-ignore
  export interface TableOptions<D extends Record<string, unknown>>
    extends UsePaginationOptions<D>,
      UseSortByOptions<D> {}

  // @ts-ignore
  export interface Hooks<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseExpandedHooks<D>,
      UseGroupByHooks<D>,
      UseRowSelectHooks<D>,
      UseSortByHooks<D> {}

  // @ts-ignore
  export interface TableInstance<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseColumnOrderInstanceProps<D>,
      UseExpandedInstanceProps<D>,
      UseFiltersInstanceProps<D>,
      UseGlobalFiltersInstanceProps<D>,
      UseGroupByInstanceProps<D>,
      UsePaginationInstanceProps<D>,
      UseRowSelectInstanceProps<D>,
      UseRowStateInstanceProps<D>,
      UseSortByInstanceProps<D> {}

  // @ts-ignore
  export interface TableState<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseColumnOrderState<D>,
      UseExpandedState<D>,
      UseFiltersState<D>,
      UseGlobalFiltersState<D>,
      UseGroupByState<D>,
      UsePaginationState<D>,
      UseResizeColumnsState<D>,
      UseRowSelectState<D>,
      UseRowStateState<D>,
      UseSortByState<D> {}

  // @ts-ignore
  export interface ColumnInterface<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseFiltersColumnOptions<D>,
      UseGlobalFiltersColumnOptions<D>,
      UseGroupByColumnOptions<D>,
      UseResizeColumnsColumnOptions<D>,
      UseSortByColumnOptions<D> {}

  // @ts-ignore
  export interface ColumnInstance<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseFiltersColumnProps<D>,
      UseGroupByColumnProps<D>,
      UseResizeColumnsColumnProps<D>,
      UseSortByColumnProps<D> {}

  // @ts-ignore
  export interface Cell<
    D extends Record<string, unknown> = Record<string, unknown>,
    V = any
  > extends UseGroupByCellProps<D>, UseRowStateCellProps<D> {}

  // @ts-ignore
  export interface Row<
    D extends Record<string, unknown> = Record<string, unknown>
  >
    extends UseExpandedRowProps<D>,
      UseGroupByRowProps<D>,
      UseRowSelectRowProps<D>,
      UseRowStateRowProps<D> {}
}
