import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";

import { useSelectionState } from "./useSelectionState";

interface IFruit {
  name: string;
}
const fruits: IFruit[] = [
  { name: "Apple" },
  { name: "Orange" },
  { name: "Banana" },
];

describe("useSelectionState", () => {
  it("Initializes selection state and hook loads with no errors", () => {
    const { result } = renderHook(() =>
      useSelectionState<IFruit>({ items: fruits })
    );
    expect(result.current.selectedItems).toEqual([]);
  });

  it("Updates state correctly when toggling an item", () => {
    const { result } = renderHook(() =>
      useSelectionState<string>({
        items: ["A", "B", "C"],
      })
    );

    act(() => result.current.selectItems(["A"], true));
    expect(result.current.isItemSelected("A")).toBe(true);
  });

  it("Updates state correctly when setting selected state", () => {
    const { result } = renderHook(() =>
      useSelectionState<string>({
        items: ["A", "B", "C"],
      })
    );

    act(() => result.current.selectItems(["A"], true));
    expect(result.current.selectedItems).toEqual(["A"]);
  });

  it("Updates state correctly when selecting/deselecting all", () => {
    const { result } = renderHook(() =>
      useSelectionState<string>({
        items: ["A", "B", "C"],
      })
    );
    act(() => result.current.selectAll(true));
    expect(result.current.areAllSelected).toEqual(true);
    expect(result.current.selectedItems).toEqual(["A", "B", "C"]);

    act(() => result.current.selectAll(false));
    expect(result.current.areAllSelected).toEqual(false);
    expect(result.current.selectedItems).toEqual([]);
  });

  it("Preserves the original order of items when selecting out of order", () => {
    const { result } = renderHook(() =>
      useSelectionState<IFruit>({
        items: fruits,
        isEqual: (a, b) => a.name === b.name,
      })
    );
    act(() =>
      result.current.selectItems(
        [{ name: "Orange" }, { name: "Apple" }, { name: "Banana" }],
        true
      )
    );
    expect(result.current.selectedItems).toEqual(fruits);
  });

  it("Handles initialSelected properly", () => {
    const { result, rerender } = renderHook(() =>
      useSelectionState<string>({
        items: ["A", "B", "C"],
        initialSelected: ["A"],
      })
    );
    rerender();
    expect(result.current.selectedItems).toEqual(["A"]);
  });

  it("Handles a custom isEqual arg properly", () => {
    const { result } = renderHook(() =>
      useSelectionState<IFruit>({
        items: fruits,
        isEqual: (a, b) => a.name === b.name,
      })
    );
    act(() => result.current.selectItems([{ name: "Apple" }], true));
    expect(result.current.selectedItems).toEqual([{ name: "Apple" }]);
  });
});
