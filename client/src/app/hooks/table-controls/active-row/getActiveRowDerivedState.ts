import { KeyWithValueType } from "@app/utils/type-utils";
import { IActiveRowState } from "./useActiveRowState";

export interface IActiveRowDerivedStateArgs<TItem> {
  currentPageItems: TItem[];
  idProperty: KeyWithValueType<TItem, string | number>;
  activeRowState: IActiveRowState;
}

export interface IActiveRowDerivedState<TItem> {
  activeRowItem: TItem | null;
  setActiveRowItem: (item: TItem | null) => void;
  clearActiveRow: () => void;
}

// Note: This is not named `getLocalActiveRowDerivedState` because it is always local,
//       and it is still used when working with server-managed tables.
export const getActiveRowDerivedState = <TItem>({
  currentPageItems,
  idProperty,
  activeRowState: { activeRowId, setActiveRowId },
}: IActiveRowDerivedStateArgs<TItem>): IActiveRowDerivedState<TItem> => ({
  activeRowItem:
    currentPageItems.find((item) => item[idProperty] === activeRowId) || null,
  setActiveRowItem: (item: TItem | null) => {
    const itemId = (item?.[idProperty] ?? null) as string | number | null; // TODO Assertion shouldn't be necessary here but TS isn't fully inferring item[idProperty]?
    setActiveRowId(itemId);
  },
  clearActiveRow: () => setActiveRowId(null),
});
