import { FilterCategory, FilterType } from "@app/components/FilterToolbar";

import { getLocalFilterDerivedState } from "../getLocalFilterDerivedState";

interface TestItem {
  name: string;
  order?: number;
  flag?: boolean;
}

const items: TestItem[] = [{ name: "Foo" }, { name: "Bar" }];

const defaultCategory: FilterCategory<TestItem, string> = {
  categoryKey: "name",
  type: FilterType.multiselect,
  title: "Name",
  placeholderText: "Placeholder",
};

const withParams = (
  filters: string[] | null | undefined,
  categories: FilterCategory<TestItem, string>[] = [defaultCategory]
) => ({
  items,
  filterCategories: categories,
  filterState: {
    filterValues: { name: filters },
    setFilterValues: () => {},
  },
});

describe("getLocalFilterDerivedState", () => {
  it("returns all items when empty filters applied", () => {
    const { filteredItems } = getLocalFilterDerivedState(withParams([]));
    expect(filteredItems).toEqual(items);
  });
  it("returns all items when nullish filters applied", () => {
    const { filteredItems } = getLocalFilterDerivedState(withParams(null));
    expect(filteredItems).toEqual(items);
  });
  it("returns no items if filter key doesn't map to property name (and no category is provided)", () => {
    const { filteredItems } = getLocalFilterDerivedState({
      items,
      filterCategories: [],
      filterState: {
        filterValues: { test: ["Foo"] },
        setFilterValues: () => {},
      },
    });
    expect(filteredItems).toEqual([]);
  });
  it("filters when no filter category found but filter key maps to property name", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(
        ["Foo"],
        [
          {
            ...defaultCategory,
            categoryKey: "test",
          },
        ]
      )
    );
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("returns no items for falsy item values (without getItemValue)", () => {
    const { filteredItems } = getLocalFilterDerivedState({
      items: [{ name: "Test", order: 0 }],
      filterCategories: [],
      filterState: {
        filterValues: { order: ["0"] },
        setFilterValues: () => {},
      },
    });
    expect(filteredItems).toEqual([]);
  });
  it("filters falsy item values with getItemValue returning string)", () => {
    const { filteredItems } = getLocalFilterDerivedState({
      items: [{ name: "Test", order: 0 }],
      filterCategories: [
        {
          categoryKey: "order",
          title: "Order",
          type: FilterType.multiselect,
          placeholderText: "Placeholder",
          getItemValue: (item) => String(item.order),
        },
      ],
      filterState: {
        filterValues: { order: ["0"] },
        setFilterValues: () => {},
      },
    });
    expect(filteredItems).toEqual([{ name: "Test", order: 0 }]);
  });
  it("returns no items for falsy item values if  getItemValue returns boolean", () => {
    const { filteredItems } = getLocalFilterDerivedState({
      items: [{ name: "Test", flag: false }],
      filterCategories: [
        {
          categoryKey: "flag",
          title: "Flag",
          type: FilterType.multiselect,
          placeholderText: "Placeholder",
          getItemValue: (item) => item.flag,
        },
      ],
      filterState: {
        filterValues: { flag: ["false"] },
        setFilterValues: () => {},
      },
    });
    expect(filteredItems).toEqual([]);
  });
  it("filters if filter key doesn't map to property name but category provides getItemValue", () => {
    const { filteredItems } = getLocalFilterDerivedState({
      items,
      filterCategories: [
        {
          ...defaultCategory,
          categoryKey: "test",
          getItemValue: (item: TestItem) => item.name,
        },
      ],
      filterState: {
        filterValues: { test: ["Foo"] },
        setFilterValues: () => {},
      },
    });
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("filters without getItemValue (category exists)", () => {
    const { filteredItems } = getLocalFilterDerivedState(withParams(["Foo"]));
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("filters with getItemValue", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(
        ["Foo"],
        [
          {
            ...defaultCategory,
            getItemValue: (item: TestItem) => item.name,
          },
        ]
      )
    );
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("filters with partial match", () => {
    const { filteredItems } = getLocalFilterDerivedState(withParams(["oo"]));
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("filters case insensitive", () => {
    const { filteredItems } = getLocalFilterDerivedState(withParams(["foo"]));
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("returns results when at least one OR filter was matched", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(["foo", "oo", "test"])
    );
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("returns no results when all OR filters were not matched", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(["test", "test2"])
    );
    expect(filteredItems).toEqual([]);
  });

  it("returns results when all AND filters were matched", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(
        ["f", "o"],
        [
          {
            ...defaultCategory,
            logicOperator: "AND",
          },
        ]
      )
    );
    expect(filteredItems).toEqual([{ name: "Foo" }]);
  });
  it("returns no results when at least one AND filter was not matched", () => {
    const { filteredItems } = getLocalFilterDerivedState(
      withParams(
        ["foo", "test"],
        [
          {
            ...defaultCategory,
            logicOperator: "AND",
          },
        ]
      )
    );
    expect(filteredItems).toEqual([]);
  });
});
