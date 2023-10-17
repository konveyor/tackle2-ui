import { parseMaybeNumericString } from "@app/utils/utils";
import { IFeaturePersistenceArgs } from "../types";
import { usePersistentState } from "@app/hooks/usePersistentState";

/**
 * The "source of truth" state for the active item feature.
 * - Included in the object returned by useTableControlState (ITableControlState) under the `activeItemState` property.
 * - Also included in the `ITableControls` object returned by useTableControlProps and useLocalTableControls.
 * @see ITableControlState
 * @see ITableControls
 */
export interface IActiveItemState {
  activeItemId: string | number | null;
  setActiveItemId: (id: string | number | null) => void;
}

/**
 * Base args for useActiveItemState
 * - Makes up part of the arguments object taken by useTableControlState (IUseTableControlStateArgs)
 * - Properties here are included in the `ITableControls` object returned by useTableControlProps and useLocalTableControls.
 * @see ITableControls
 */
export type IActiveItemStateArgs = { isActiveItemEnabled?: boolean };

/**
 * Provides the "source of truth" state for the active item feature.
 * - Used internally by useTableControlState
 * - Takes base args defined above as well as optional args for persisting state to a configurable storage target.
 * @see PersistTarget
 */
export const useActiveItemState = <
  TPersistenceKeyPrefix extends string = string,
>(
  args: IActiveItemStateArgs &
    IFeaturePersistenceArgs<TPersistenceKeyPrefix> = {}
): IActiveItemState => {
  const { isActiveItemEnabled, persistTo, persistenceKeyPrefix } = args;

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [activeItemId, setActiveItemId] = usePersistentState<
    string | number | null,
    TPersistenceKeyPrefix,
    "activeItem"
  >({
    isEnabled: !!isActiveItemEnabled,
    defaultValue: null,
    persistenceKeyPrefix,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
          persistTo,
          keys: ["activeItem"],
          serialize: (activeItemId) => ({
            activeItem: activeItemId !== null ? String(activeItemId) : null,
          }),
          deserialize: ({ activeItem }) => parseMaybeNumericString(activeItem),
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          persistTo,
          key: "activeItem",
        }
      : { persistTo }),
  });
  return { activeItemId, setActiveItemId };
};
