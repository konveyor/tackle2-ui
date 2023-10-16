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
  IActiveItemDerivedState,
  IActiveItemPropHelpersExternalArgs,
  IActiveItemState,
  IActiveItemStateArgs,
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

/**
 * A feature of the table. State related to each feature can be persisted in separate places.
 */
export type TableFeature =
  | "filter"
  | "sort"
  | "pagination"
  | "selection"
  | "expansion"
  | "activeItem";

/**
 * Where to persist state related to a table feature or all table features.
 */
export type PersistTarget =
  | "state"
  | "urlParams"
  | "localStorage"
  | "sessionStorage";

/**
 * Common persistence-specific args
 * - Extra args needed for useTableControlState and each feature-specific use*State hook for persisting state
 */
export type ICommonPersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = {
  /**
   * A short string uniquely identifying a specific table. Automatically prepended to any key used in state persistence (e.g. in a URL parameter or localStorage).
   * - Optional: Only omit if this table will not be rendered at the same time as any other tables.
   * - Allows multiple tables to be used on the same page with the same PersistTarget.
   * - Cannot contain a `:` character since this is used as the delimiter in the prefixed key.
   */
  persistenceKeyPrefix?: DisallowCharacters<TPersistenceKeyPrefix, ":">;
};
/**
 * Feature-level persistence-specific args
 * - Extra args needed for each use[Feature]State hook for persisting state
 */
export type IFeaturePersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = ICommonPersistenceArgs<TPersistenceKeyPrefix> & {
  /**
   * Where to persist state related to this feature.
   */
  persistTo?: PersistTarget;
};
/**
 * Table-level persistence-specific args
 * - Extra args needed for useTableControlState for persisting state
 * - Supports specifying a different PersistTarget for each TableFeature
 */
export type ITablePersistenceArgs<
  TPersistenceKeyPrefix extends string = string,
> = ICommonPersistenceArgs<TPersistenceKeyPrefix> & {
  /**
   * Where to persist state for this table. Can either be a single target for all features or an object mapping individual features to different targets.
   */
  persistTo?:
    | PersistTarget
    | Partial<Record<TableFeature | "default", PersistTarget>>;
};

/**
 * Table-level state configuration arguments
 * - Used by useTableControlState
 * - Made up of the combined feature-level state configuration argument objects.
 * - Does not require any state or query data in scope
 * - Requires/disallows args based on which features are enabled (see individual [Feature]StateArgs types)
 * - Properties here are included in the `tableControls` object.
 * @see ITableControls
 */
export type IUseTableControlStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = {
  /**
   * An ordered mapping of unique keys to human-readable column name strings.
   * - Keys of this object are used as unique identifiers for columns (`columnKey`).
   * - Values of this object are rendered in the column headers by default (can be overridden by passing children to <Th>) and used as `dataLabel` for cells in the column.
   */
  columnNames: Record<TColumnKey, string>;
} & IFilterStateArgs<TItem, TFilterCategoryKey> &
  ISortStateArgs<TSortableColumnKey> &
  IPaginationStateArgs & {
    isSelectionEnabled?: boolean; // TODO move this into useSelectionState when we move it from lib-ui
  } & IExpansionStateArgs &
  IActiveItemStateArgs &
  ITablePersistenceArgs<TPersistenceKeyPrefix>;

/**
 * Table-level state object
 * - Returned by useTableControlState
 * - Contains persisted state for all table features.
 * - Also includes all of useTableControlState's arguments for convenience, since useTableControlProps requires them along with the state itself
 * - Note that this only contains the "source of truth" state, generally driven by item ids and containing no references to item objects. This is separate from "derived state" which is computed at render time.
 * - Properties here are included in the `tableControls` object.
 * @see ITableControls
 */
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
  /**
   * State for the filter feature. Returned by useFilterState.
   */
  filterState: IFilterState<TFilterCategoryKey>;
  /**
   * State for the sort feature. Returned by useSortState.
   */
  sortState: ISortState<TSortableColumnKey>;
  /**
   * State for the pagination feature. Returned by usePaginationState.
   */
  paginationState: IPaginationState;
  /**
   * State for the expansion feature. Returned by usePaginationState.
   */
  expansionState: IExpansionState<TColumnKey>;
  /**
   * State for the active item feature. Returned by useActiveItemState.
   */
  activeItemState: IActiveItemState;
};

/**
 * Table-level local derived state configuration arguments
 * - "Local derived state" refers to the results of client-side filtering/sorting/pagination. This is not used for server-paginated tables.
 * - Made up of the combined feature-level local derived state argument objects.
 * - Used by getLocalTableControlDerivedState.
 *   - getLocalTableControlDerivedState also requires the return values from useTableControlState.
 * - Also used indirectly by the useLocalTableControls shorthand hook.
 * - Requires state and query data in scope.
 */
export type ITableControlLocalDerivedStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
> = ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey> &
  ILocalSortDerivedStateArgs<TItem, TSortableColumnKey> &
  ILocalPaginationDerivedStateArgs<TItem>;
// There is no ILocalExpansionDerivedStateArgs type because expansion derived state is always local and internal to useTableControlProps
// There is no ILocalActiveItemDerivedStateArgs type because expansion derived state is always local and internal to useTableControlProps

/**
 * Table-level derived state object
 * - "Derived state" here refers to the results of filtering/sorting/pagination performed either on the client or the server.
 * - Used by useTableControlProps
 * - Provided by either:
 *   - Return values of getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
 *   - The consumer directly (server-side filtering/sorting/pagination)
 * - Properties here are included in the `tableControls` object.
 * @see ITableControls
 */
export type ITableControlDerivedState<TItem> = {
  /**
   * The items to be rendered on the current page of the table. These items have already been filtered, sorted and paginated.
   */
  currentPageItems: TItem[];
  /**
   * The total number of items in the entire un-filtered, un-paginated table.
   */
  totalItemCount: number;
};

/**
 * Rendering configuration arguments
 * - Used by only useTableControlProps
 * - Requires state and query values in scope
 * - Combines all args for useTableControlState with the return values of useTableControlState, args used only for rendering, and args derived from either:
 *   - Server-side filtering/sorting/pagination provided by the consumer
 *   - getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
 * - Properties here are included in the `tableControls` object.
 * @see ITableControls
 */
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
  IActiveItemPropHelpersExternalArgs<TItem> &
  ITableControlDerivedState<TItem> & {
    /**
     * Whether the table data is loading
     */
    isLoading?: boolean;
    /**
     * Override the `numRenderedColumns` value used internally. This should be equal to the colSpan of a cell that takes the full width of the table.
     * - Optional: when omitted, the value used is based on the number of `columnNames` and whether features are enabled that insert additional columns (like checkboxes for selection, a kebab for actions, etc).
     */
    forceNumRenderedColumns?: number;
    /**
     * The variant of the table. Affects some spacing. Gets included in `propHelpers.tableProps`.
     */
    variant?: TableProps["variant"];
    /**
     * Whether there is a separate column for action buttons/menus at the right side of the table
     */
    hasActionsColumn?: boolean;
    /**
     * Selection state
     * @todo this won't be included here when useSelectionState gets moved from lib-ui. It is separated from the other state temporarily and used only at render time.
     */
    selectionState: ReturnType<typeof useSelectionState<TItem>>;
  };

/**
 * Table controls object
 * - The object used for rendering. Includes everything you need to return JSX for your table.
 * - Returned by useTableControlProps and useLocalTableControls
 * - Includes all args and return values from useTableControlState along with derived state and propHelpers.
 */
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
  /**
   * The number of extra non-data columns that appear before the data in each row. Based on whether selection and single-expansion features are enabled.
   */
  numColumnsBeforeData: number;
  /**
   * The number of extra non-data columns that appear after the data in each row. Based on `hasActionsColumn`.
   */
  numColumnsAfterData: number;
  /**
   * The total number of columns to be rendered including data and non-data columns.
   */
  numRenderedColumns: number;
  /**
   * Values derived at render time from the expansion feature state. Includes helper functions for convenience.
   */
  expansionDerivedState: IExpansionDerivedState<TItem, TColumnKey>;
  /**
   * Values derived at render time from the active-item feature state. Includes helper functions for convenience.
   */
  activeItemDerivedState: IActiveItemDerivedState<TItem>;
  /**
   * Prop helpers: where it all comes together.
   * These objects and functions provide props for specific PatternFly components in your table derived from the state and arguments above.
   * As much of the prop passing as possible is abstracted away via these helpers, which are to be used with spread syntax (e.g. <Td {...getTdProps({ columnKey: "foo" })}/>).
   * Any props included here can be overridden by simply passing additional props after spreading the helper onto a component.
   */
  propHelpers: {
    /**
     * Props for the Toolbar component.
     * Includes spacing based on the table variant and props related to filtering.
     */
    toolbarProps: Omit<ToolbarProps, "ref">;
    /**
     * Props for the Table component.
     */
    tableProps: Omit<TableProps, "ref">;
    /**
     * Returns props for the Th component for a specific column.
     * Includes default children (column name) and props related to sorting.
     */
    getThProps: (args: { columnKey: TColumnKey }) => Omit<ThProps, "ref">;
    /**
     * Returns props for the Tr component for a specific data item.
     * Includes props related to the active-item feature.
     */
    getTrProps: (args: {
      item: TItem;
      onRowClick?: TrProps["onRowClick"];
    }) => Omit<TrProps, "ref">;
    /**
     * Returns props for the Td component for a specific column.
     * Includes default `dataLabel` (column name) and props related to compound expansion.
     * If this cell is a toggle for a compound-expandable row, pass `isCompoundExpandToggle: true`.
     * @param args - `columnKey` is always required. If `isCompoundExpandToggle` is passed, `item` and `rowIndex` are also required.
     */
    getTdProps: (
      args: { columnKey: TColumnKey } & DiscriminatedArgs<
        "isCompoundExpandToggle",
        { item: TItem; rowIndex: number }
      >
    ) => Omit<TdProps, "ref">;
    /**
     * Props for the FilterToolbar component.
     */
    filterToolbarProps: IFilterToolbarProps<TItem, TFilterCategoryKey>;
    /**
     * Props for the Pagination component.
     */
    paginationProps: PaginationProps;
    /**
     * Props for the ToolbarItem component containing the Pagination component above the table.
     */
    paginationToolbarItemProps: ToolbarItemProps;
    /**
     * Props for the ToolbarBulkSelector component.
     */
    toolbarBulkSelectorProps: IToolbarBulkSelectorProps<TItem>;
    /**
     * Returns props for the Td component used as the checkbox cell for each row when using the selection feature.
     */
    getSelectCheckboxTdProps: (args: {
      item: TItem;
      rowIndex: number;
    }) => Omit<TdProps, "ref">;
    /**
     * Returns props for the Td component used as the expand toggle when using the single-expand variant of the expansion feature.
     */
    getSingleExpandButtonTdProps: (args: {
      item: TItem;
      rowIndex: number;
    }) => Omit<TdProps, "ref">;
    /**
     * Returns props for the Td component used to contain the expanded content when using the expansion feature.
     * The Td rendered with these props should be the only child of its Tr, which should be directly after the Tr of the row being expanded.
     * The two Trs for the expandable row and expanded content row should be contained in a Tbody with no other Tr components.
     */
    getExpandedContentTdProps: (args: { item: TItem }) => Omit<TdProps, "ref">;
  };
};

/**
 * Combined configuration arguments for client-paginated tables
 * - Used by useLocalTableControls shorthand hook
 * - Combines args for useTableControlState, getLocalTableControlDerivedState and useTableControlProps, omitting args for any of these that come from return values of the others.
 */
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
