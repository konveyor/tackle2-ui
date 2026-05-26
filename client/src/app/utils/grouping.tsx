import type { OverflowActionMenuItemProps } from "@app/components/overflow-action-menu";

/**
 * Take an array of grouped items, filter out falsy values, and add a separator to
 * the beginning of each group.  This is useful for building an action toolbar with
 * a separator between groups.
 *
 * @param separator - A function that returns a separator item.
 * @param groups - An array of arrays of items.
 * @returns An array of items with a separator added to the beginning of each non-empty group.
 */
export const filterAndAddSeparator = <T,>(
  separator: (index: number) => T,
  groups: Array<Array<T | Falsy>>
): Array<T> => {
  return groups
    .map<Array<T>>((group) => group.filter(Boolean))
    .filter((group) => group.length > 0)
    .flatMap((group, index) =>
      index === 0 ? group : [separator(index), ...group]
    );
};

export const addSeparatorForOverflow = (
  separator: (index: number, isShared: boolean) => OverflowActionMenuItemProps,
  groups: Array<Array<OverflowActionMenuItemProps | Falsy>>
): OverflowActionMenuItemProps[] => {
  const filteredGroups = groups
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length > 0);

  const sharedGroups: [OverflowActionMenuItemProps[], boolean][] =
    filteredGroups.map((group) => [
      group,
      group.every((item) => item.isShared),
    ]);

  const sharedGroupCounts = sharedGroups
    .toReversed()
    .reduce(
      (acc, [group, isShared]) => {
        const previousSharedCount =
          acc.length === 0 ? 0 : acc[acc.length - 1][0];
        acc.push([
          isShared ? previousSharedCount + 1 : previousSharedCount,
          acc.length,
          group,
          isShared,
        ]);
        return acc;
      },
      [] as [number, number, OverflowActionMenuItemProps[], boolean][]
    )
    .toReversed();

  return sharedGroupCounts.flatMap(
    ([sharedCount, totalCount, group, isShared], index) =>
      totalCount > 0
        ? [...group, separator(index, isShared || totalCount === sharedCount)]
        : group
  );
};
