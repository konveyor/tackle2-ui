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

/**
 * Args for useActiveItemPropHelpers that come from outside useTableControlProps
 * - Partially satisfied by the object returned by useTableControlState (ITableControlState)
 * - Makes up part of the arguments object taken by useTableControlProps (IUseTableControlPropsArgs)
 */
export type IActiveItemPropHelpersExternalArgs<TItem> =
  IActiveItemDerivedStateArgs<TItem> &
    Omit<IUseActiveItemEffectsArgs<TItem>, "activeItemDerivedState"> & {
      isLoading?: boolean;
      activeItemState: IActiveItemState;
    };

/**
 * Given "source of truth" state for the active item feature, returns derived state and `propHelpers`.
 * - Used internally by useTableControlProps
 * - "Derived state" here refers to values and convenience functions derived at render time.
 * - Also triggers side effects to prevent invalid state
 */
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
