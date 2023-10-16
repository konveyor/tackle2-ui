import { TableProps, TdProps, ThProps, TrProps } from "@patternfly/react-table";
import { ISelectionStateArgs, useSelectionState } from "@migtools/lib-ui";
import { DisallowCharacters, DiscriminatedArgs } from "@app/utils/type-utils";
import {
  IFilterStateArgs,
  ILocalFilterDerivedStateArgs,
  IFilterPropHelpersExternalArgs,
  IFilterState,
} from "./filtering";
import {
  ILocalSortDerivedStateArgs,
  ISortPropHelpersExternalArgs,
  ISortState,
  ISortStateArgs,
} from "./sorting";
import {
  IPaginationStateArgs,
  ILocalPaginationDerivedStateArgs,
  IPaginationPropHelpersExternalArgs,
  IPaginationState,
} from "./pagination";
import {
  IExpansionDerivedState,
  IExpansionState,
  IExpansionStateArgs,
} from "./expansion";
import {
  IActiveRowDerivedState,
  IActiveRowPropHelpersExternalArgs,
  IActiveRowState,
  IActiveRowStateArgs,
} from "./active-item";
import {
  PaginationProps,
  ToolbarItemProps,
  ToolbarProps,
} from "@patternfly/react-core";
import { IFilterToolbarProps } from "@app/components/FilterToolbar";
import { IToolbarBulkSelectorProps } from "@app/components/ToolbarBulkSelector";
import { IExpansionPropHelpersExternalArgs } from "./expansion/useExpansionPropHelpers";

// Generic type params used here:
//   TItem - The actual API objects represented by rows in the table. Can be any object.
//   TColumnKey - Union type of unique identifier strings for the columns in the table
//   TSortableColumnKey - A subset of column keys that have sorting enabled
//   TFilterCategoryKey - Union type of unique identifier strings for filters (not necessarily the same as column keys)
//   TPersistenceKeyPrefix - String (must not include a `:` character) used to distinguish persisted state for multiple tables

export type TableFeature =
  | "filter"
  | "sort"
  | "pagination"
  | "selection"
  | "expansion"
  | "activeRow";

export type PersistTarget =
  | "state"
  | "urlParams"
  | "localStorage"
  | "sessionStorage";

// Persistence-specific args
// - Extra args needed for useTableControlState and each feature-specific use*State hook for persisting state
// - Does not require any state or query data in scope
// Common
export type ICommonPersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = {
  persistenceKeyPrefix?: DisallowCharacters<TPersistenceKeyPrefix, ":">;
};
// Feature-level
export type IFeaturePersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = ICommonPersistenceArgs<TPersistenceKeyPrefix> & {
  persistTo?: PersistTarget;
};
// Table-level
export type ITablePersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = ICommonPersistenceArgs<TPersistenceKeyPrefix> & {
  persistTo?:
    | PersistTarget
    | Partial<Record<TableFeature | "default", PersistTarget>>;
};

// Table-level state args
// - Used by useTableControlState
// - Does not require any state or query data in scope
// - Requires/disallows args based on which features are enabled (see individual [Feature]StateArgs types)
export type IUseTableControlStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = {
  columnNames: Record<TColumnKey, string>; // An ordered mapping of unique keys to human-readable column name strings
} & IFilterStateArgs<TItem, TFilterCategoryKey> &
  ISortStateArgs<TSortableColumnKey> &
  IPaginationStateArgs & {
    isSelectionEnabled?: boolean; // TODO move this into useSelectionState when we move it from lib-ui
  } & IExpansionStateArgs &
  IActiveRowStateArgs &
  ITablePersistenceArgs<TPersistenceKeyPrefix>;

// Table-level state object
// - Returned by useTableControlState
// - Contains persisted state for all features
// - Also includes all of useTableControlState's args for convenience, since useTableControlProps requires them along with the state itself
export type ITableControlState<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = IUseTableControlStateArgs<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> & {
  filterState: IFilterState<TFilterCategoryKey>;
  sortState: ISortState<TSortableColumnKey>;
  paginationState: IPaginationState;
  expansionState: IExpansionState<TColumnKey>;
  activeRowState: IActiveRowState;
};

// Table-level local derived state args
// - Used by getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
//   - getLocalTableControlDerivedState also requires the return values from useTableControlState
// - Also used indirectly by the useLocalTableControls shorthand
// - Requires state and query data in scope
export type ITableControlLocalDerivedStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
> = ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey> &
  ILocalSortDerivedStateArgs<TItem, TSortableColumnKey> &
  ILocalPaginationDerivedStateArgs<TItem>;
// There is no ILocalExpansionDerivedStateArgs type because expansion derived state is always local and internal to useTableControlProps
// There is no ILocalActiveRowDerivedStateArgs type because expansion derived state is always local and internal to useTableControlProps

// Table-level derived state object
// - Used by useTableControlProps
// - Provided by either:
//   - Return values of getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
//   - The consumer directly (server-side filtering/sorting/pagination)
export type ITableControlDerivedState<TItem> = {
  currentPageItems: TItem[];
  totalItemCount: number;
};

// Rendering args
// - Used by only useTableControlProps
// - Requires state and query values in scope
// - Combines all args above with the return values of useTableControlState, args used only for rendering, and args derived from either:
//   - Server-side filtering/sorting/pagination provided by the consumer
//   - getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
export type IUseTableControlPropsArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = IUseTableControlStateArgs<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> &
  IFilterPropHelpersExternalArgs<TItem, TFilterCategoryKey> &
  ISortPropHelpersExternalArgs<TColumnKey, TSortableColumnKey> &
  IPaginationPropHelpersExternalArgs &
  // ISelectionPropHelpersExternalArgs // TODO when we move selection from lib-ui
  IExpansionPropHelpersExternalArgs<TItem, TColumnKey> &
  IActiveRowPropHelpersExternalArgs<TItem> &
  ITableControlDerivedState<TItem> & {
    isLoading?: boolean;
    forceNumRenderedColumns?: number;
    variant?: TableProps["variant"];
    hasActionsColumn?: boolean;
    selectionState: ReturnType<typeof useSelectionState<TItem>>; // TODO this won't be included here when selection is part of useTableControlState
  };

// Table controls object
// - The object used for rendering
// - Returned by useTableControlProps
// - Includes all args and return values from earlier hooks in the chain along with propHelpers
export type ITableControls<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = IUseTableControlPropsArgs<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> & {
  numColumnsBeforeData: number;
  numColumnsAfterData: number;
  numRenderedColumns: number;
  expansionDerivedState: IExpansionDerivedState<TItem, TColumnKey>;
  activeRowDerivedState: IActiveRowDerivedState<TItem>;
  propHelpers: {
    toolbarProps: Omit<ToolbarProps, "ref">;
    tableProps: Omit<TableProps, "ref">;
    getThProps: (args: { columnKey: TColumnKey }) => Omit<ThProps, "ref">;
    getTrProps: (args: {
      item: TItem;
      onRowClick?: TrProps["onRowClick"];
    }) => Omit<TrProps, "ref">;
    getTdProps: (
      args: { columnKey: TColumnKey } & DiscriminatedArgs<
        "isCompoundExpandToggle",
        { item: TItem; rowIndex: number }
      >
    ) => Omit<TdProps, "ref">;
    filterToolbarProps: IFilterToolbarProps<TItem, TFilterCategoryKey>;
    paginationProps: PaginationProps;
    paginationToolbarItemProps: ToolbarItemProps;
    toolbarBulkSelectorProps: IToolbarBulkSelectorProps<TItem>;
    getSelectCheckboxTdProps: (args: {
      item: TItem;
      rowIndex: number;
    }) => Omit<TdProps, "ref">;
    getSingleExpandButtonTdProps: (args: {
      item: TItem;
      rowIndex: number;
    }) => Omit<TdProps, "ref">;
    getExpandedContentTdProps: (args: { item: TItem }) => Omit<TdProps, "ref">;
  };
};

// Combined args for locally-paginated tables
// - Used by useLocalTableControls shorthand hook
// - Combines args for useTableControlState, getLocalTableControlDerivedState and useTableControlProps,
//   omitting args for getLocalTableControlDerivedState and useTableControlProps that come from return values of useTableControlState and getLocalTableControlDerivedState.
export type IUseLocalTableControlsArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = IUseTableControlStateArgs<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> &
  Omit<
    ITableControlLocalDerivedStateArgs<
      TItem,
      TColumnKey,
      TSortableColumnKey,
      TFilterCategoryKey
    > &
      IUseTableControlPropsArgs<
        TItem,
        TColumnKey,
        TSortableColumnKey,
        TFilterCategoryKey
      >,
    | keyof ITableControlDerivedState<TItem>
    | keyof ITableControlState<
        TItem,
        TColumnKey,
        TSortableColumnKey,
        TFilterCategoryKey,
        TPersistenceKeyPrefix
      >
    | "selectionState" // TODO this won't be included here when selection is part of useTableControlState
  > &
  Pick<ISelectionStateArgs<TItem>, "initialSelected" | "isItemSelectable">; // TODO this won't be included here when selection is part of useTableControlState
