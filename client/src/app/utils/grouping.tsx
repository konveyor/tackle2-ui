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
