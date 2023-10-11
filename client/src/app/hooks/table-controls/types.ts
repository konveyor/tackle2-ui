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

// Generic type params used here:
//   TItem - The actual API objects represented by rows in the table. Can be any object.
//   TColumnKey - Union type of unique identifier strings for the columns in the table
//   TSortableColumnKey - A subset of column keys that have sorting enabled
//   TFilterCategoryKey - Union type of unique identifier strings for filters (not necessarily the same as column keys)

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

// Common args
// - Used by both useLocalTableControlState and useTableControlState
// - Does not require any state or query values in scope
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
// - Used by both useLocalTableControlState and useTableControlProps
// - Requires query values and defined TItem type in scope but not state values
export interface ITableControlDataDependentArgs<TItem> {
  isLoading?: boolean;
  idProperty: KeyWithValueType<TItem, string | number>;
  forceNumRenderedColumns?: number;
}

// Derived state option args
// - Used by only useLocalTableControlState (client-side filtering/sorting/pagination)
// - Requires state and query values in scope
export type IUseLocalTableControlStateArgs<
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
  ITableControlDataDependentArgs<TItem> &
  ILocalFilterDerivedStateArgs<TItem, TFilterCategoryKey> &
  IFilterStateArgs<TItem, TFilterCategoryKey> &
  ILocalSortDerivedStateArgs<TItem, TSortableColumnKey> &
  ILocalPaginationDerivedStateArgs<TItem> &
  Pick<ISelectionStateArgs<TItem>, "initialSelected" | "isItemSelectable">; // TODO ???

// Rendering args
// - Used by only useTableControlProps
// - Requires state and query values in scope
// - Combines all args above with either:
//   - The return values of useLocalTableControlState
//   - The return values of useTableControlState and args derived from server-side filtering/sorting/pagination
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
