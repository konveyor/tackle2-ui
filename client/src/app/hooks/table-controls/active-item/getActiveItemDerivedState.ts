import { KeyWithValueType } from "@app/utils/type-utils";
import { IActiveItemState } from "./useActiveItemState";

export interface IActiveItemDerivedStateArgs<TItem> {
  currentPageItems: TItem[];
  idProperty: KeyWithValueType<TItem, string | number>;
  activeItemState: IActiveItemState;
}

export interface IActiveItemDerivedState<TItem> {
  activeItem: TItem | null;
  setActiveItem: (item: TItem | null) => void;
  clearActiveItem: () => void;
  isActiveItem: (item: TItem) => boolean;
}

// Note: This is not named `getLocalActiveItemDerivedState` because it is always local,
//       and it is still used when working with server-managed tables.
export const getActiveItemDerivedState = <TItem>({
  currentPageItems,
  idProperty,
  activeItemState: { activeItemId, setActiveItemId },
}: IActiveItemDerivedStateArgs<TItem>): IActiveItemDerivedState<TItem> => ({
  activeItem:
    currentPageItems.find((item) => item[idProperty] === activeItemId) || null,
  setActiveItem: (item: TItem | null) => {
    const itemId = (item?.[idProperty] ?? null) as string | number | null; // TODO Assertion shouldn't be necessary here but TS isn't fully inferring item[idProperty]?
    setActiveItemId(itemId);
  },
  clearActiveItem: () => setActiveItemId(null),
  isActiveItem: (item) => item[idProperty] === activeItemId,
});
