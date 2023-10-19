import { useTableControlProps } from "./useTableControlProps";
import { ITableControls, IUseLocalTableControlsArgs } from "./types";
import { getLocalTableControlDerivedState } from "./getLocalTableControlDerivedState";
import { useTableControlState } from "./useTableControlState";
import { useSelectionState } from "@migtools/lib-ui";

/**
 * Provides all state, derived state, side-effects and prop helpers needed to manage a local/client-computed table.
 * - Call this and only this if you aren't using server-side filtering/sorting/pagination.
 * - "Derived state" here refers to values and convenience functions derived at render time based on the "source of truth" state.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent state duplication.
 */
export const useLocalTableControls = <
  TNarrowedArgs extends IUseLocalTableControlsArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >,
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: TNarrowedArgs
) => {
  const state = useTableControlState<
    TNarrowedArgs,
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >(args);
  const derivedState = getLocalTableControlDerivedState<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >({ ...args, ...state });
  return useTableControlProps({
    ...args,
    ...state,
    ...derivedState,
    // TODO we won't need this here once selection state is part of useTableControlState
    selectionState: useSelectionState({
      ...args,
      isEqual: (a, b) => a[args.idProperty] === b[args.idProperty],
    }),
  }) satisfies ITableControls<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >;
};
