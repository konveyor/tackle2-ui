import { useTableControlProps } from "./useTableControlProps";
import { IUseLocalTableControlsArgs } from "./types";
import { getLocalTableControlDerivedState } from "./getLocalTableControlDerivedState";
import { useTableControlState } from "./useTableControlState";
import { useSelectionState } from "@migtools/lib-ui";

export const useLocalTableControls = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IUseLocalTableControlsArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
) => {
  const state = useTableControlState(args);
  const derivedState = getLocalTableControlDerivedState({ ...args, ...state });
  return useTableControlProps({
    ...args,
    ...state,
    ...derivedState,
    // TODO we won't need this here once selection state is part of useTableControlState
    selectionState: useSelectionState({
      ...args,
      isEqual: (a, b) => a[args.idProperty] === b[args.idProperty],
    }),
  });
};
