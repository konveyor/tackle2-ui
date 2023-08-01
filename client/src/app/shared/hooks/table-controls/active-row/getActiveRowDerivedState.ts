import { KeyWithValueType } from "@app/utils/type-utils";
import { IActiveRowState } from "./useActiveRowState";

export interface IActiveRowDerivedStateArgs<TItem> {
  currentPageItems: TItem[];
  idProperty: KeyWithValueType<TItem, string | number>;
  activeRowState: IActiveRowState;
}

// Note: This is not named `getLocalActiveRowDerivedState` because it is always local,
//       and it is still used when working with server-managed tables.
export const getActiveRowDerivedState = <TItem>({
  currentPageItems,
  idProperty,
  activeRowState: { activeRowId, setActiveRowId },
}: IActiveRowDerivedStateArgs<TItem>) => ({
  activeRowItem:
    currentPageItems.find((item) => item[idProperty] === activeRowId) || null,
  setActiveRowItem: (item: TItem | null) => {
    const itemId =
      item && item[idProperty] !== undefined ? item[idProperty] : null;
    setActiveRowId(itemId as string | number | null); // TODO Assertion shouldn't be necessary here but TS isn't fully inferring item[idProperty]?
  },
  clearActiveRow: () => setActiveRowId(null),
});
