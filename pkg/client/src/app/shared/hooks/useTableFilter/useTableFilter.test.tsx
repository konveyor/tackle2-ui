import { renderHook } from "@testing-library/react-hooks";
import { PageQuery } from "@app/api/models";

import { useTableFilter } from "./useTableFilter";

describe("useTableFilter", () => {
  it("Pagination", () => {
    const items = [...Array(15)].map((_, index) => index + 1);
    let page: PageQuery = { page: 1, perPage: 10 };

    const { result } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: () => true,
        compareToByColumn: () => 1,
      })
    );

    // Page1
    expect(result.current.pageItems).toEqual(items.slice(0, 10));
  });

  it("Filter", () => {
    const items = [...Array(15)].map((_, index) => index + 1);
    let page: PageQuery = { page: 1, perPage: 10 };

    const { result } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: (value) => value % 2 === 1,
        compareToByColumn: () => 1,
      })
    );

    // Page1
    const expectedResult = [1, 3, 5, 7, 9, 11, 13, 15];
    expect(result.current.pageItems).toEqual(expectedResult);
  });

  it("SortBy", () => {
    const items = [...Array(15)].map((_, index) => index + 1);
    let page: PageQuery = { page: 1, perPage: 10 };
    const filterItem = () => true;
    const compareToByColumn = (a: number, b: number, indexCol?: number) =>
      indexCol === 7 ? a - b : 0;

    // Verify asc
    const { result: resultAsc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: filterItem,
        sortBy: { direction: "asc", index: 7 },
        compareToByColumn: compareToByColumn,
      })
    );

    const expectedAscResult = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(resultAsc.current.pageItems).toEqual(expectedAscResult);

    // Verify desc
    const { result: resultDesc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: filterItem,
        sortBy: { direction: "desc", index: 7 },
        compareToByColumn: compareToByColumn,
      })
    );

    const expectedDescResult = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6];
    expect(resultDesc.current.pageItems).toEqual(expectedDescResult);
  });

  it("SortBy when 'compareToByColumn' return always 0", () => {
    const items = [...Array(15)].map((_, index) => index + 1);
    let page: PageQuery = { page: 1, perPage: 10 };

    const expectedResult = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Verify asc
    const { result: resultAsc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: () => true,
        sortBy: { direction: "asc", index: 7 },
        compareToByColumn: () => 0, // forcing comparison true
      })
    );

    expect(resultAsc.current.pageItems).toEqual(expectedResult);

    // Verify desc
    const { result: resultDesc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: () => true,
        sortBy: { direction: "desc", index: 7 },
        compareToByColumn: () => 0, // forcing comparison true
      })
    );

    expect(resultDesc.current.pageItems).toEqual(expectedResult);
  });

  it("SortBy when 'compareToByColumn' return always 0 and 'filter' is applied", () => {
    const items = [...Array(25)].map((_, index) => index + 1);
    let page: PageQuery = { page: 1, perPage: 10 };
    const filterItem = (val: number) => val % 2 === 0;
    const compareToByColumn = () => 0; // forcing comparison true

    const expectedResult = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

    // Verify asc
    const { result: resultAsc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: filterItem,
        sortBy: { direction: "asc", index: 7 },
        compareToByColumn: compareToByColumn,
      })
    );

    expect(resultAsc.current.pageItems).toEqual(expectedResult);

    // Verify desc
    const { result: resultDesc } = renderHook(() =>
      useTableFilter<number>({
        items: items,
        pagination: page,
        filterItem: filterItem,
        sortBy: { direction: "desc", index: 7 },
        compareToByColumn: compareToByColumn,
      })
    );

    expect(resultDesc.current.pageItems).toEqual(expectedResult);
  });
});
