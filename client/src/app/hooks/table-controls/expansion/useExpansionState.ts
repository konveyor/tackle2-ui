import { usePersistentState } from "@app/hooks/usePersistentState";
import { objectKeys } from "@app/utils/utils";
import { IFeaturePersistenceArgs } from "../types";

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

export type IExpansionStateEnabledArgs = {
  expandableVariant: "single" | "compound";
};

export type IExpansionStateArgs =
  | ({ isExpansionEnabled: true } & IExpansionStateEnabledArgs)
  | { isExpansionEnabled?: false };

export const useExpansionState = <
  TColumnKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IExpansionStateArgs &
    IFeaturePersistenceArgs<TPersistenceKeyPrefix> = {}
): IExpansionState<TColumnKey> => {
  const {
    isExpansionEnabled,
    persistTo = "state",
    persistenceKeyPrefix,
  } = args;

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [expandedCells, setExpandedCells] = usePersistentState<
    TExpandedCells<TColumnKey>,
    TPersistenceKeyPrefix,
    "expandedCells"
  >({
    defaultValue: {},
    persistenceKeyPrefix,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
          isEnabled: isExpansionEnabled,
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
          persistTo,
          key: "expandedCells",
        }
      : { persistTo }),
  });
  return { expandedCells, setExpandedCells };
};
