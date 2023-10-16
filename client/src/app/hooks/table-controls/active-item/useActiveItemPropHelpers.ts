import { TrProps } from "@patternfly/react-table";
import {
  IActiveRowDerivedStateArgs,
  getActiveRowDerivedState,
} from "./getActiveItemDerivedState";
import { IActiveRowState } from "./useActiveItemState";
import {
  IUseActiveRowEffectsArgs,
  useActiveRowEffects,
} from "./useActiveItemEffects";

// Args that should be passed into useTableControlProps
export type IActiveRowPropHelpersExternalArgs<TItem> =
  IActiveRowDerivedStateArgs<TItem> &
    Omit<IUseActiveRowEffectsArgs<TItem>, "activeRowDerivedState"> & {
      isLoading?: boolean;
      activeRowState: IActiveRowState;
    };

export const useActiveRowPropHelpers = <TItem>(
  args: IActiveRowPropHelpersExternalArgs<TItem>
) => {
  const activeRowDerivedState = getActiveRowDerivedState(args);
  const { isActiveRowItem, setActiveRowItem, clearActiveRow } =
    activeRowDerivedState;

  useActiveRowEffects({ ...args, activeRowDerivedState });

  const getActiveRowTrProps = ({
    item,
  }: {
    item: TItem;
  }): Omit<TrProps, "ref"> => ({
    isSelectable: true,
    isClickable: true,
    isRowSelected: item && isActiveRowItem(item),
    onRowClick: () => {
      if (!isActiveRowItem(item)) {
        setActiveRowItem(item);
      } else {
        clearActiveRow();
      }
    },
  });

  return { activeRowDerivedState, getActiveRowTrProps };
};
