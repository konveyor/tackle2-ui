import { TrProps } from "@patternfly/react-table";
import { IActiveRowDerivedState } from "./getActiveRowDerivedState";

export interface IGetActiveRowPropsArgs<TItem> {
  item: TItem;
  activeRowDerivedState: IActiveRowDerivedState<TItem>;
}

export const getActiveRowProps = <TItem>({
  item,
  activeRowDerivedState: { setActiveRowItem, clearActiveRow, isActiveRowItem },
}: IGetActiveRowPropsArgs<TItem>): { tr: Omit<TrProps, "ref"> } => ({
  tr: {
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
  },
});
