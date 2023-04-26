import { TableComposableProps } from "@patternfly/react-table";
import {
  IFilterStateArgs,
  ILocalFilterDerivedStateArgs,
  IFilterPropsArgs,
} from "./filtering";
import {
  ILocalSortDerivedStateArgs,
  ISortPropsArgs,
  ISortStateArgs,
} from "./sorting";
import {
  IPaginationStateArgs,
  ILocalPaginationDerivedStateArgs,
  IPaginationPropsArgs,
} from "./pagination";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";

// Generic type params used here:
//   TItem - The actual API objects represented by rows in the table. Must have at least a name property
//   TColumnKey - Union type of unique identifier strings for the columns in the table
//   TSortableColumnKey - A subset of column keys that have sorting enabled
//   TFilterCategoryKey - Union type of unique identifier strings for filters (not necessarily the same as column keys)

// Common args
// - Used by both useLocalTableControlState and useTableControlUrlParams
// - Does not require any state or query values in scope
export interface ITableControlCommonArgs<
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
> extends ISortStateArgs<TSortableColumnKey>,
    IPaginationStateArgs {
  columnNames: Record<TColumnKey, string>; // An ordered mapping of unique keys to human-readable column name strings
  isSelectable?: boolean;
  hasPagination?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
  variant?: TableComposableProps["variant"];
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
export type IUseTableControlStateArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string
> = ITableControlCommonArgs<TColumnKey, TSortableColumnKey> &
  ITableControlFetchStatusArgs &
  ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey> &
  IFilterStateArgs &
  ILocalSortDerivedStateArgs<TItem, TSortableColumnKey> &
  ILocalPaginationDerivedStateArgs<TItem>;

// Rendering args
// - Used by only useTableControlProps
// - Requires state and query values in scope
// - Combines all args above with either:
//   - The return values of useTableControlState
//   - The return values of useTableControlUrlParams and args derived from server-side filtering/sorting/pagination
export interface IUseTableControlPropsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string
> extends ITableControlCommonArgs<TColumnKey, TSortableColumnKey>,
    ITableControlFetchStatusArgs,
    IFilterPropsArgs<TItem, TFilterCategoryKey>,
    ISortPropsArgs<TColumnKey, TSortableColumnKey>,
    IPaginationPropsArgs {
  currentPageItems: TItem[];
  expansionState: ReturnType<
    typeof useCompoundExpansionState<TItem, TColumnKey>
  >;
  selectionState: ReturnType<typeof useSelectionState<TItem>>;
}
