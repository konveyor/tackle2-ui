import { TrProps } from "@patternfly/react-table";
import {
  IActiveItemDerivedStateArgs,
  getActiveItemDerivedState,
} from "./getActiveItemDerivedState";
import { IActiveItemState } from "./useActiveItemState";
import {
  IUseActiveItemEffectsArgs,
  useActiveItemEffects,
} from "./useActiveItemEffects";

// Args that should be passed into useTableControlProps
export type IActiveItemPropHelpersExternalArgs<TItem> =
  IActiveItemDerivedStateArgs<TItem> &
    Omit<IUseActiveItemEffectsArgs<TItem>, "activeItemDerivedState"> & {
      isLoading?: boolean;
      activeItemState: IActiveItemState;
    };

export const useActiveItemPropHelpers = <TItem>(
  args: IActiveItemPropHelpersExternalArgs<TItem>
) => {
  const activeItemDerivedState = getActiveItemDerivedState(args);
  const { isActiveItem, setActiveItem, clearActiveItem } =
    activeItemDerivedState;

  useActiveItemEffects({ ...args, activeItemDerivedState });

  const getActiveItemTrProps = ({
    item,
  }: {
    item: TItem;
  }): Omit<TrProps, "ref"> => ({
    isSelectable: true,
    isClickable: true,
    isRowSelected: item && isActiveItem(item),
    onRowClick: () => {
      if (!isActiveItem(item)) {
        setActiveItem(item);
      } else {
        clearActiveItem();
      }
    },
  });

  return { activeItemDerivedState, getActiveItemTrProps };
};
