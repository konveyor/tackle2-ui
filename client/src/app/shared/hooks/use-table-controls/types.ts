import { TableComposableProps } from "@patternfly/react-table";
import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useFilterState } from "../useFilterState";
import { ISortDerivedStateArgs, ISortState, ISortStateArgs } from "./sorting";
import {
  IPaginationState,
  IPaginationStateArgs,
  IPaginationDerivedStateArgs,
} from "./pagination";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";

// Common args
// - Used by both useTableControlState and useTableControlUrlParams
// - Can be defined without any state or query data in scope
export interface ITableControlCommonArgs<
  TItem extends { name: string }, // The actual API objects represented by rows in the table
  TColumnKey extends string, // Unique identifiers for the columns in the table
  TSortableColumnKey extends TColumnKey // A subset of column keys that have sorting enabled
> extends ISortStateArgs<TSortableColumnKey>,
    IPaginationStateArgs {
  columnNames: Record<TColumnKey, string>; // An ordered mapping of unique keys to human-readable column name strings
  isSelectable?: boolean;
  hasPagination?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
  variant?: TableComposableProps["variant"];
  ////
  filterCategories?: FilterCategory<TItem>[]; // TODO this shouldn't be included here if we split out IFilterStateArgs
}

// Derived state option args
// - Used for only useTableControlState (client-side filtering/sorting/pagination)
export interface IUseTableControlStateArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ITableControlCommonArgs<TItem, TColumnKey, TSortableColumnKey>,
    ISortDerivedStateArgs<TItem, TSortableColumnKey>,
    IPaginationDerivedStateArgs<TItem> {
  filterStorageKey?: string; // TODO this shouldn't be included here if we split out IFilterStateArgs?
}

// Rendering args
// - Used by useTableControlProps
// - Combines all args above with either:
//   - The return values of useTableControlState
//   - The return values of useTableControlUrlParams and args derived from server-side filtering/sorting/pagination
export interface IUseTableControlPropsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ITableControlCommonArgs<TItem, TColumnKey, TSortableColumnKey> {
  currentPageItems: TItem[];
  totalItemCount: number;
  isLoading?: boolean;
  filterState: ReturnType<typeof useFilterState<TItem>>; // TODO adjust this for separation of concerns
  expansionState: ReturnType<
    typeof useCompoundExpansionState<TItem, TColumnKey>
  >;
  selectionState: ReturnType<typeof useSelectionState<TItem>>;
  sortState: ISortState<TSortableColumnKey>;
  paginationState: IPaginationState;
}
