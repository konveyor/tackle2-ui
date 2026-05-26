import type { OverflowActionMenuItemProps } from "@app/components/overflow-action-menu";

import { addSeparatorForOverflow } from "./grouping";

const item = (
  itemKey: string,
  isShared = false
): OverflowActionMenuItemProps => ({ itemKey, isShared });

const sep = (
  index: number,
  isShared: boolean
): OverflowActionMenuItemProps => ({
  itemKey: `sep-${index}`,
  isSeparator: true,
  isShared,
});

describe("addSeparatorForOverflow", () => {
  it("returns an empty array when all groups are empty", () => {
    expect(addSeparatorForOverflow(sep, [[], []])).toEqual([]);
  });

  it("returns a single group's items without any separator", () => {
    const result = addSeparatorForOverflow(sep, [[item("a"), item("b")]]);
    expect(result).toEqual([item("a"), item("b")]);
  });

  it("appends a separator after the first group when there are two groups", () => {
    const result = addSeparatorForOverflow(sep, [[item("a")], [item("b")]]);
    expect(result).toEqual([item("a"), sep(0, false), item("b")]);
  });

  it("appends a shared separator after the first group", () => {
    const result = addSeparatorForOverflow(sep, [
      [item("a", true), item("b", true)],
      [item("c")],
    ]);
    expect(result).toEqual([
      item("a", true),
      item("b", true),
      sep(0, true),
      item("c"),
    ]);
  });

  it("appends a standard separator after the first group, if the groups is mixed", () => {
    const result = addSeparatorForOverflow(sep, [
      [item("a", false), item("b", true)],
      [item("c")],
    ]);
    expect(result).toEqual([
      item("a", false),
      item("b", true),
      sep(0, false),
      item("c"),
    ]);
  });

  it("appends a shared separator when last groups are shared", () => {
    const result = addSeparatorForOverflow(sep, [
      [item("a")],
      [item("b", true)],
      [item("c", true)],
    ]);
    expect(result).toEqual([
      item("a"),
      sep(0, true),
      item("b", true),
      sep(1, true),
      item("c", true),
    ]);
  });

  it("appends a standard separator when at least one group is not shared", () => {
    const result = addSeparatorForOverflow(sep, [
      [item("a")],
      [item("b", true)],
      [item("c", true)],
      [item("d")],
    ]);
    expect(result).toEqual([
      item("a"),
      sep(0, false),
      item("b", true),
      sep(1, true),
      item("c", true),
      sep(2, true),
      item("d"),
    ]);
  });

  it("filters out falsy items within groups before adding separators", () => {
    const result = addSeparatorForOverflow(sep, [
      [item("a"), false, null, undefined],
      [item("b")],
    ]);
    expect(result).toEqual([item("a"), sep(0, false), item("b")]);
  });

  it("drops groups that become empty after filtering falsy values", () => {
    const result = addSeparatorForOverflow(sep, [
      [false, null],
      [item("a")],
      [undefined],
      [item("b")],
    ]);
    expect(result).toEqual([item("a"), sep(0, false), item("b")]);
  });
});
