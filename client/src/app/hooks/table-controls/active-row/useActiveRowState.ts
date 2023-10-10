import { parseMaybeNumericString } from "@app/utils/utils";
import { IPersistenceOptions } from "../types";
import { usePersistentState } from "@app/hooks/usePersistentState";

export interface IActiveRowState {
  activeRowId: string | number | null;
  setActiveRowId: (id: string | number | null) => void;
}

export const useActiveRowState = <
  TPersistenceKeyPrefix extends string = string,
>(
  args: IPersistenceOptions<TPersistenceKeyPrefix> = {}
): IActiveRowState => {
  const { persistTo, persistenceKeyPrefix } = args;

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [activeRowId, setActiveRowId] = usePersistentState<
    string | number | null,
    TPersistenceKeyPrefix,
    "activeRow"
  >({
    defaultValue: null,
    persistenceKeyPrefix,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
          persistTo,
          keys: ["activeRow"],
          serialize: (activeRowId) => ({
            activeRow: activeRowId !== null ? String(activeRowId) : null,
          }),
          deserialize: ({ activeRow }) => parseMaybeNumericString(activeRow),
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          persistTo,
          key: "activeRow",
        }
      : { persistTo }),
  });
  return { activeRowId, setActiveRowId };
};
