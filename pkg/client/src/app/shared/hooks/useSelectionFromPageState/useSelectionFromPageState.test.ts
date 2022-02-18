import { renderHook, act } from "@testing-library/react-hooks";

import { useSelectionFromPageState } from "./useSelectionFromPageState";

describe("useSelectionFromPageState", () => {
  it("updates state correctly when toggling an item", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
      })
    );

    // Toggle element
    const { toggleItemSelected } = result.current;
    act(() => toggleItemSelected("b"));
    expect(result.current.selectedItems).toMatchObject(["b"]);
  });

  it("updates state correctly when selecting/deselecting all", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
      })
    );

    // Toggle element
    const { selectAllPage } = result.current;
    act(() => selectAllPage());
    expect(result.current.selectedItems).toMatchObject([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("handles multiple selections properly", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
      })
    );

    // Toggle element
    const { selectMultiple } = result.current;
    act(() => selectMultiple(["b", "c"], true));
    expect(result.current.selectedItems).toMatchObject(["b", "c"]);
  });

  it("handles unselect properly", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
        initialSelected: ["b", "c"],
      })
    );
    expect(result.current.selectedItems).toMatchObject(["b", "c"]);

    // Toggle element
    const { toggleItemSelected } = result.current;
    act(() => toggleItemSelected("b"));
    expect(result.current.selectedItems).toMatchObject(["c"]);
  });

  it("handles multiple unselect properly", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
        initialSelected: ["b", "c", "d"],
      })
    );
    expect(result.current.selectedItems).toMatchObject(["b", "c", "d"]);

    // Toggle element
    const { selectMultiple } = result.current;
    act(() => selectMultiple(["b", "c"], false));
    expect(result.current.selectedItems).toMatchObject(["d"]);
  });

  it("handles unselect all page properly", () => {
    const { result } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: ["a", "b", "c", "d", "e"],
        totalItems: 10,
        initialSelected: ["a", "b", "c", "d", "e"],
      })
    );
    expect(result.current.selectedItems).toMatchObject([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);

    // Toggle element
    const { selectAllPage } = result.current;
    act(() => selectAllPage(false));
    expect(result.current.selectedItems).toMatchObject([]);
  });

  it("handles multiple pages properly", () => {
    let pageItems = ["a", "b", "c", "d", "e"];

    const { result, rerender } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: pageItems,
        totalItems: 10,
      })
    );

    // Toggle element
    const { selectMultiple: selectMultipleOnFirstPage } = result.current;
    act(() => selectMultipleOnFirstPage(["b", "c"], true));
    expect(result.current.selectedItems).toMatchObject(["b", "c"]);

    // Navigate to next page
    pageItems = ["f", "g", "h", "i", "j"];
    rerender();

    const { selectMultiple: selectMultipleOnSecondPage } = result.current;
    act(() => selectMultipleOnSecondPage(["h", "i"], true));
    expect(result.current.selectedItems).toMatchObject(["b", "c", "h", "i"]);
  });

  it("handles areAllSelected properly", () => {
    let pageItems = ["a", "b", "c", "d", "e"];

    const { result, rerender } = renderHook(() =>
      useSelectionFromPageState<string>({
        pageItems: pageItems,
        totalItems: 10,
      })
    );

    // Toggle element
    const { selectMultiple: selectMultipleOnFirstPage } = result.current;
    act(() => selectMultipleOnFirstPage(pageItems, true));
    expect(result.current.selectedItems).toMatchObject(pageItems);

    // Navigate to next page
    pageItems = ["f", "g", "h", "i", "j"];
    rerender();

    const { selectMultiple: selectMultipleOnSecondPage } = result.current;
    act(() => selectMultipleOnSecondPage(["f", "g", "h", "i"], true));
    expect(result.current.areAllSelected).toBe(false);

    act(() => selectMultipleOnSecondPage(["f", "g", "h", "i", "j"], true));
    expect(result.current.areAllSelected).toBe(true);
  });
});
