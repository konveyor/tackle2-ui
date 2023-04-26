import { TableComposableProps } from "@patternfly/react-table";
import { FilterCategory } from "@app/shared/components/FilterToolbar";
import { useLegacyFilterState } from "../useLegacyFilterState";
import {
  ILocalSortDerivedStateArgs,
  ISortPropsArgs,
  ISortStateArgs,
} from "./sorting";
import {
  IPaginationStateArgs,
  ILocalPaginationDerivedStateArgs,
} from "./pagination";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { IPaginationPropsArgs } from "./pagination/getPaginationProps";

// Common args
// - Used by both useTableControlState and useTableControlUrlParams
// - Does not require any state or query values in scope
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

// Fetch-related args
// - Used by both useTableControlState and useTableControlProps
// - Requires query values in scope but not state values
export interface ITableControlFetchStatusArgs {
  isLoading?: boolean;
}

// Derived state option args
// - Used by only useTableControlState (client-side filtering/sorting/pagination)
// - Requires state and query values in scope
export interface IUseTableControlStateArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ITableControlCommonArgs<TItem, TColumnKey, TSortableColumnKey>,
    ITableControlFetchStatusArgs,
    ILocalSortDerivedStateArgs<TItem, TSortableColumnKey>,
    ILocalPaginationDerivedStateArgs<TItem> {
  filterStorageKey?: string; // TODO this shouldn't be included here if we split out IFilterStateArgs?
}

// Rendering args
// - Used by only useTableControlProps
// - Requires state and query values in scope
// - Combines all args above with either:
//   - The return values of useTableControlState
//   - The return values of useTableControlUrlParams and args derived from server-side filtering/sorting/pagination
export interface IUseTableControlPropsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ITableControlCommonArgs<TItem, TColumnKey, TSortableColumnKey>,
    ITableControlFetchStatusArgs,
    ISortPropsArgs<TColumnKey, TSortableColumnKey>,
    IPaginationPropsArgs {
  currentPageItems: TItem[];
  filterState: ReturnType<typeof useLegacyFilterState<TItem>>; // TODO adjust this for separation of concerns
  expansionState: ReturnType<
    typeof useCompoundExpansionState<TItem, TColumnKey>
  >;
  selectionState: ReturnType<typeof useSelectionState<TItem>>;
}
