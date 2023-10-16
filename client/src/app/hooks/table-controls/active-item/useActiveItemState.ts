import { parseMaybeNumericString } from "@app/utils/utils";
import { IFeaturePersistenceArgs } from "../types";
import { usePersistentState } from "@app/hooks/usePersistentState";

export interface IActiveItemState {
  activeItemId: string | number | null;
  setActiveItemId: (id: string | number | null) => void;
}

export type IActiveItemStateArgs = { isActiveItemEnabled?: boolean };

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
