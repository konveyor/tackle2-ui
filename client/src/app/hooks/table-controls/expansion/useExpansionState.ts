import {
  BaseUsePersistentStateOptions,
  usePersistentState,
} from "@app/hooks/usePersistentState";
import { objectKeys } from "@app/utils/utils";
import { IPersistenceOptions } from "../types";

// TExpandedCells maps item[idProperty] values to either:
//  - The key of an expanded column in that row, if the table is compound-expandable
//  - The `true` literal value (the entire row is expanded), if non-compound-expandable
export type TExpandedCells<TColumnKey extends string> = Record<
  string,
  TColumnKey | boolean
>;

export interface IExpansionState<TColumnKey extends string> {
  expandedCells: Record<string, boolean | TColumnKey>;
  setExpandedCells: (
    newExpandedCells: Record<string, boolean | TColumnKey>
  ) => void;
}

export const useExpansionState = <
  TColumnKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IPersistenceOptions<TPersistenceKeyPrefix>
): IExpansionState<TColumnKey> => {
  const { persistTo = "state", persistenceKeyPrefix } = args;
  const baseStateOptions: BaseUsePersistentStateOptions<
    TExpandedCells<TColumnKey>
  > = {
    defaultValue: {},
    persistenceKeyPrefix,
  };

  // Note: for the discriminated union here to work without TypeScript getting confused
  //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
  //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
  const [expandedCells, setExpandedCells] = usePersistentState(
    persistTo === "urlParams"
      ? {
          ...baseStateOptions,
          persistTo,
          keys: ["expandedCells"],
          serialize: (expandedCellsObj) => {
            if (!expandedCellsObj || objectKeys(expandedCellsObj).length === 0)
              return { expandedCells: null };
            return { expandedCells: JSON.stringify(expandedCellsObj) };
          },
          deserialize: ({ expandedCells: expandedCellsStr }) => {
            try {
              return JSON.parse(expandedCellsStr || "{}");
            } catch (e) {
              return {};
            }
          },
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          ...baseStateOptions,
          persistTo,
          key: `${
            persistenceKeyPrefix ? `${persistenceKeyPrefix}:` : ""
          }expandedCells`,
        }
      : { ...baseStateOptions, persistTo }
  );
  return { expandedCells, setExpandedCells };
};
