import { KeyWithValueType } from "@app/utils/type-utils";
import { IActiveItemState } from "./useActiveItemState";

/**
 * Args for getActiveItemDerivedState
 * - Partially satisfied by the object returned by useTableControlState (ITableControlState)
 * - Makes up part of the arguments object taken by useTableControlProps (IUseTableControlPropsArgs)
 * @see ITableControlState
 * @see IUseTableControlPropsArgs
 */
export interface IActiveItemDerivedStateArgs<TItem> {
  currentPageItems: TItem[];
  idProperty: KeyWithValueType<TItem, string | number>;
  activeItemState: IActiveItemState;
}

/**
 * Derived state for the active item feature
 * - "Derived state" here refers to values and convenience functions derived at render time based on the "source of truth" state.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent state duplication.
 */
export interface IActiveItemDerivedState<TItem> {
  activeItem: TItem | null;
  setActiveItem: (item: TItem | null) => void;
  clearActiveItem: () => void;
  isActiveItem: (item: TItem) => boolean;
}

/**
 * Given the "source of truth" state for the active item feature and additional arguments, returns "derived state" values and convenience functions.
 * - "source of truth" (persisted) state and "derived state" are kept separate to prevent state duplication.
 *
 * NOTE: Unlike `getLocal[Filter|Sort|Pagination]DerivedState`, this is not named `getLocalActiveItemDerivedState` because it
 * is always local/client-computed, and it is still used when working with server-computed tables
 * (it's not specific to client-only-computed tables like the other `getLocal*DerivedState` functions are).
 */
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
