import * as React from "react";
import { getActiveItemDerivedState } from "./getActiveItemDerivedState";
import { IActiveItemState } from "./useActiveItemState";

export interface IUseActiveItemEffectsArgs<TItem> {
  isLoading?: boolean;
  activeItemState: IActiveItemState;
  activeItemDerivedState: ReturnType<typeof getActiveItemDerivedState<TItem>>;
}

export const useActiveItemEffects = <TItem>({
  isLoading,
  activeItemState: { activeItemId },
  activeItemDerivedState: { activeItem, clearActiveItem },
}: IUseActiveItemEffectsArgs<TItem>) => {
  React.useEffect(() => {
    // If some state change (e.g. refetch, pagination) causes the active item to disappear,
    // remove its id from state so the drawer won't automatically reopen if the item comes back.
    if (!isLoading && activeItemId && !activeItem) {
      clearActiveItem();
    }
  }, [isLoading, activeItemId, activeItem]);
};
