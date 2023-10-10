import { parseMaybeNumericString } from "@app/utils/utils";
import { IPersistenceOptions } from "../types";
import {
  BaseUsePersistentStateOptions,
  usePersistentState,
} from "@app/hooks/usePersistentState";

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
  const baseStateOptions: BaseUsePersistentStateOptions<
    string | number | null
  > = {
    defaultValue: null,
    persistenceKeyPrefix,
  };

  // Note: for the discriminated union here to work without TypeScript getting confused
  //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
  //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
  const [activeRowId, setActiveRowId] = usePersistentState(
    persistTo === "urlParams"
      ? {
          ...baseStateOptions,
          persistTo,
          keys: ["activeRow"],
          serialize: (activeRowId) => ({
            activeRow: activeRowId !== null ? String(activeRowId) : null,
          }),
          deserialize: ({ activeRow }) => parseMaybeNumericString(activeRow),
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          ...baseStateOptions,
          persistTo,
          key: `${
            persistenceKeyPrefix ? `${persistenceKeyPrefix}:` : ""
          }activeRow`,
        }
      : { ...baseStateOptions, persistTo }
  );
  return { activeRowId, setActiveRowId };
};
