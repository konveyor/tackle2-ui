import * as React from "react";
import { ISortBy, SortByDirection } from "@patternfly/react-table";

import i18n from "@app/i18n";
import { universalComparator } from "@app/utils/utils";

/**
 * @deprecated The return value of useLegacySortState which predates table-controls/table-batteries and is deprecated.
 * @see useLegacySortState
 */
export interface ILegacySortStateHook<T> {
  sortBy: ISortBy;
  onSort: (
    event: React.SyntheticEvent,
    index: number,
    direction: SortByDirection
  ) => void;
  sortedItems: T[];
}

/**
 * @deprecated This hook predates table-controls/table-batteries and still hasn't been refactored away from all of our tables.
 *   It was refactored to expose an API based on columnKey instead of column index, and to return generic state data and decouple
 *   the client-side-sorting piece to another helper function.
 *   See useSortState in table-controls for the new version, which should probably be used instead of this everywhere eventually.
 *   NOTE ALSO: useLegacyFilterState and useLegacyPagination state were able to have their logic factored out
 *     to reuse the new helpers, but useLegacySortState has to retain its incompatible logic because of
 *     the switch from using column indexes to `columnKey`s.
 * @see useSortState
 * @see getLocalSortDerivedState
 * @see getSortProps
 */
export const useLegacySortState = <T>(
  items: T[],
  getSortValues?: (item: T) => (string | number | boolean)[],
  initialSort: ISortBy = { index: 0, direction: "asc" }
): ILegacySortStateHook<T> => {
  const [sortBy, setSortBy] = React.useState<ISortBy>(initialSort);

  const onSort = (
    event: React.SyntheticEvent,
    index: number,
    direction: SortByDirection
  ) => {
    setSortBy({ index, direction });
  };

  if (!getSortValues) return { sortBy, onSort, sortedItems: items };

  let sortedItems = items;
  if (sortBy.index !== undefined && sortBy.direction !== undefined) {
    sortedItems = [...items].sort((a: T, b: T) => {
      const { index, direction } = sortBy;
      const aValue = getSortValues(a)[index || 0];
      const bValue = getSortValues(b)[index || 0];
      const compareValue = universalComparator(aValue, bValue, i18n.language);
      return direction === "asc" ? compareValue : -compareValue;
    });
  }

  return { sortBy, onSort, sortedItems };
};
