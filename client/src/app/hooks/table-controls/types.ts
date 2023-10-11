import { TableProps } from "@patternfly/react-table";
import { ISelectionStateArgs, useSelectionState } from "@migtools/lib-ui";
import { DisallowCharacters } from "@app/utils/type-utils";
import {
  IFilterStateArgs,
  ILocalFilterDerivedStateArgs,
  IFilterPropsArgs,
  IFilterState,
} from "./filtering";
import {
  ILocalSortDerivedStateArgs,
  ISortPropsArgs,
  ISortState,
  ISortStateArgs,
} from "./sorting";
import {
  IPaginationStateArgs,
  ILocalPaginationDerivedStateArgs,
  IPaginationPropsArgs,
  IPaginationState,
} from "./pagination";
import { IExpansionDerivedStateArgs, IExpansionState } from "./expansion";
import { IActiveRowDerivedStateArgs, IActiveRowState } from "./active-row";
import { useTableControlState } from "./useTableControlState";

// Generic type params used here:
//   TItem - The actual API objects represented by rows in the table. Can be any object.
//   TColumnKey - Union type of unique identifier strings for the columns in the table
//   TSortableColumnKey - A subset of column keys that have sorting enabled
//   TFilterCategoryKey - Union type of unique identifier strings for filters (not necessarily the same as column keys)
//   TPersistenceKeyPrefix - String (must not include a `:` character) used to distinguish persisted state for multiple tables

// TODO when calling useTableControlState, the TItem type is not inferred and some of the params have it inferred as `unknown`.
//      this currently doesn't seem to matter since TItem becomes inferred later when currentPageItems is in scope,
//      but we should see if we can fix that (maybe not depend on TItem in the extended types here, or find a way
//      to pass TItem while still letting the rest of the generics be inferred.
//      This may be resolved in a newer TypeScript version after https://github.com/microsoft/TypeScript/pull/54047 is merged!
//      See https://github.com/konveyor/tackle2-ui/issues/1456

export type PersistTarget =
  | "state"
  | "urlParams"
  | "localStorage"
  | "sessionStorage";

// Persistence-specific args
// - Extra args needed for useTableControlState and each feature-specific use*State hook for persisting state
// - Does not require any state or query data in scope
export type IPersistenceOptions<TPersistenceKeyPrefix extends string = string> =
  {
    persistTo?: PersistTarget;
    persistenceKeyPrefix?: DisallowCharacters<TPersistenceKeyPrefix, ":">;
  };

// State args
// - Used by useTableControlState
// - Does not require any state or query data in scope
export type IUseTableControlStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = IFilterStateArgs<TItem, TFilterCategoryKey> &
  ISortStateArgs<TSortableColumnKey> &
  IPaginationStateArgs &
  // There is no IExpansionStateArgs because the only args there are the IPersistenceOptions
  // There is no IActiveRowStateArgs because the only args there are the IPersistenceOptions
  Omit<IPersistenceOptions<TPersistenceKeyPrefix>, "persistTo"> & {
    persistTo?:
      | PersistTarget
      | {
          default?: PersistTarget;
          filters?: PersistTarget;
          sort?: PersistTarget;
          pagination?: PersistTarget;
          expansion?: PersistTarget;
          activeRow?: PersistTarget;
        };
    columnNames: Record<TColumnKey, string>; // An ordered mapping of unique keys to human-readable column name strings
    isSelectable?: boolean;
    hasPagination?: boolean; // TODO disable pagination state stuff if this is falsy
    expandableVariant?: "single" | "compound" | null; // TODO disable expandable state stuff if this is falsy
    // TODO do we want to have a featuresEnabled object instead?
  };

// State object
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

// Local derived state args
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
// There is no ILocalExpansionDerivedStateArgs because expansion derived state is always local an internal to useTableControlProps
// There is no ILocalActiveRowDerivedStateArgs because expansion derived state is always local an internal to useTableControlProps

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
> = IUseTableControlStateArgs<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey
> &
  IFilterPropsArgs<TItem, TFilterCategoryKey> &
  ISortPropsArgs<TColumnKey, TSortableColumnKey> &
  IPaginationPropsArgs &
  IExpansionDerivedStateArgs<TItem, TColumnKey> & // TODO should this be IExpansionPropsArgs? should we lift that stuff out of useTableControlProps?
  IActiveRowDerivedStateArgs<TItem> & // TODO should this be IActiveRowPropsArgs? should we lift that stuff out of useTableControlProps?
  ITableControlDerivedState<TItem> & {
    isLoading?: boolean;
    forceNumRenderedColumns?: number;
    variant?: TableProps["variant"];
    hasActionsColumn?: boolean;
    selectionState: ReturnType<typeof useSelectionState<TItem>>; // TODO this won't be included here when selection is part of useTableControlState
  };

// Combined args for locally-paginated tables
// - Used by useLocalTableControls shorthand hook
// - Combines args for useTableControlState, getLocalTableControlDerivedState and useTableControlProps,
//   omitting args for useTableControlProps that come from return values of useTableControlState and getLocalTableControlDerivedState.
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
  ITableControlLocalDerivedStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey
  > &
  Omit<
    IUseTableControlPropsArgs<
      TItem,
      TColumnKey,
      TSortableColumnKey,
      TFilterCategoryKey
    >,
    | keyof (ITableControlDerivedState<TItem> &
        // TODO make this an explicit type
        ReturnType<
          typeof useTableControlState<
            TItem,
            TColumnKey,
            TSortableColumnKey,
            TFilterCategoryKey,
            TPersistenceKeyPrefix
          >
        >)
    | "selectionState" // TODO this won't be included here when selection is part of useTableControlState
  > &
  Pick<ISelectionStateArgs<TItem>, "initialSelected" | "isItemSelectable">; // TODO this won't be included here when selection is part of useTableControlState
