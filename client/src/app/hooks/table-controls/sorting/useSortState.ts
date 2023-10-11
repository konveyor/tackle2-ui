import { IFeaturePersistenceArgs } from "..";
import { usePersistentState } from "@app/hooks/usePersistentState";

export interface IActiveSort<TSortableColumnKey extends string> {
  columnKey: TSortableColumnKey;
  direction: "asc" | "desc";
}

export interface ISortState<TSortableColumnKey extends string> {
  activeSort: IActiveSort<TSortableColumnKey> | null;
  setActiveSort: (sort: IActiveSort<TSortableColumnKey>) => void;
}

export type ISortStateArgs<TSortableColumnKey extends string> = {
  sortableColumns?: TSortableColumnKey[];
  initialSort?: IActiveSort<TSortableColumnKey> | null;
};

export const useSortState = <
  TSortableColumnKey extends string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: ISortStateArgs<TSortableColumnKey> &
    IFeaturePersistenceArgs<TPersistenceKeyPrefix>
): ISortState<TSortableColumnKey> => {
  const {
    persistTo = "state",
    persistenceKeyPrefix,
    sortableColumns = [],
    initialSort = sortableColumns[0]
      ? { columnKey: sortableColumns[0], direction: "asc" }
      : null,
  } = args;

  // We won't need to pass the latter two type params here if TS adds support for partial inference.
  // See https://github.com/konveyor/tackle2-ui/issues/1456
  const [activeSort, setActiveSort] = usePersistentState<
    IActiveSort<TSortableColumnKey> | null,
    TPersistenceKeyPrefix,
    "sortColumn" | "sortDirection"
  >({
    defaultValue: initialSort,
    persistenceKeyPrefix,
    // Note: For the discriminated union here to work without TypeScript getting confused
    //       (e.g. require the urlParams-specific options when persistTo === "urlParams"),
    //       we need to pass persistTo inside each type-narrowed options object instead of outside the ternary.
    ...(persistTo === "urlParams"
      ? {
          persistTo,
          keys: ["sortColumn", "sortDirection"],
          serialize: (activeSort) => ({
            sortColumn: activeSort?.columnKey || null,
            sortDirection: activeSort?.direction || null,
          }),
          deserialize: (urlParams) =>
            urlParams.sortColumn && urlParams.sortDirection
              ? {
                  columnKey: urlParams.sortColumn as TSortableColumnKey,
                  direction: urlParams.sortDirection as "asc" | "desc",
                }
              : null,
        }
      : persistTo === "localStorage" || persistTo === "sessionStorage"
      ? {
          persistTo,
          key: "sort",
        }
      : { persistTo }),
  });
  return { activeSort, setActiveSort };
};
