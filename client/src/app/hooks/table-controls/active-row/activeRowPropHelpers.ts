import { TrProps } from "@patternfly/react-table";
import { IActiveRowDerivedState } from "./getActiveRowDerivedState";

export interface IGetActiveRowTrPropsArgs<TItem> {
  item: TItem;
  activeRowDerivedState: IActiveRowDerivedState<TItem>;
}

export const getActiveRowTrProps = <TItem>({
  item,
  activeRowDerivedState: { setActiveRowItem, clearActiveRow, isActiveRowItem },
}: IGetActiveRowTrPropsArgs<TItem>): Omit<TrProps, "ref"> => ({
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
