import { TableProps } from "@patternfly/react-table";
import { ISelectionStateArgs, useSelectionState } from "@migtools/lib-ui";
import { DisallowCharacters, KeyWithValueType } from "@app/utils/type-utils";
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
import { IExpansionDerivedStateArgs } from "./expansion";
import { IActiveRowDerivedStateArgs } from "./active-row";
import { useTableControlState } from ".";

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
// - Extra args needed for useTableControlState and each concern-specific use*State hook in URL params mode
// - Does not require any state or query values in scope
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
    hasPagination?: boolean;
    expandableVariant?: "single" | "compound" | null;
    hasActionsColumn?: boolean;
    variant?: TableProps["variant"];
  };

// Data-dependent args
// - Used by both getLocalTableControlDerivedState and useTableControlProps
// - Also used indirectly by the useLocalTableControls shorthand
// - Requires query data and defined TItem type in scope but not state values
export interface ITableControlDataDependentArgs<TItem> {
  isLoading?: boolean;
  idProperty: KeyWithValueType<TItem, string | number>;
  forceNumRenderedColumns?: number;
}

// Derived state option args
// - Used by getLocalTableControlDerivedState (client-side filtering/sorting/pagination)
// - Also used indirectly by the useLocalTableControls shorthand
// - Requires state and query data in scope
export type IGetLocalTableControlDerivedStateArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
> = ReturnType<
  // TODO make this an explicit type
  typeof useTableControlState<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
> &
  ITableControlDataDependentArgs<TItem> &
  ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey> &
  IFilterStateArgs<TItem, TFilterCategoryKey> & // TODO ???
  ILocalSortDerivedStateArgs<TItem, TSortableColumnKey> &
  ILocalPaginationDerivedStateArgs<TItem> &
  Pick<ISelectionStateArgs<TItem>, "initialSelected" | "isItemSelectable">; // TODO ???

// Args for useLocalTableControls shorthand hook
// - Combines args for useTableControlState and getLocalTableControlDerivedState
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
  IGetLocalTableControlDerivedStateArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >;

// Rendering args
// - Used by only useTableControlProps
// - Requires state and query values in scope
// - Combines all args above with the return values of useTableControlState and args derived from either:
//   - Server-side filtering/sorting/pagination
//   - `getLocal[Feature]DerivedState` logic
export interface IUseTableControlPropsArgs<
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
> extends IUseTableControlStateArgs<
      TItem,
      TColumnKey,
      TSortableColumnKey,
      TFilterCategoryKey
    >,
    ITableControlDataDependentArgs<TItem>,
    IFilterPropsArgs<TItem, TFilterCategoryKey>,
    ISortPropsArgs<TColumnKey, TSortableColumnKey>,
    IPaginationPropsArgs,
    IExpansionDerivedStateArgs<TItem, TColumnKey>,
    IActiveRowDerivedStateArgs<TItem> {
  currentPageItems: TItem[];
  selectionState: ReturnType<typeof useSelectionState<TItem>>; // TODO make this optional? fold it in?
}
