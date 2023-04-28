import * as React from "react";
import {
  SelectOptionProps,
  ToolbarToggleGroup,
  ToolbarItem,
  Dropdown,
  DropdownToggle,
  DropdownItem,
} from "@patternfly/react-core";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";

import { FilterControl } from "./FilterControl";

export enum FilterType {
  select = "select",
  multiselect = "multiselect",
  search = "search",
}

export type FilterValue = string[] | undefined | null;

export interface OptionPropsWithKey extends SelectOptionProps {
  key: string;
}

export interface IBasicFilterCategory<
  TItem, // The actual API objects we're filtering
  TFilterCategoryKey extends string // Unique identifiers for each filter category (inferred from key properties if possible)
> {
  key: TFilterCategoryKey;
  title: string;
  type: FilterType; // If we want to support arbitrary filter types, this could be a React node that consumes context instead of an enum
  getItemValue?: (item: TItem) => string | boolean;
}

export interface IMultiselectFilterCategory<
  TItem,
  TFilterCategoryKey extends string
> extends IBasicFilterCategory<TItem, TFilterCategoryKey> {
  selectOptions: OptionPropsWithKey[];
  placeholderText?: string;
  logicOperator?: "AND" | "OR";
}

export interface ISelectFilterCategory<TItem, TFilterCategoryKey extends string>
  extends IBasicFilterCategory<TItem, TFilterCategoryKey> {
  selectOptions: OptionPropsWithKey[];
}

export interface ISearchFilterCategory<TItem, TFilterCategoryKey extends string>
  extends IBasicFilterCategory<TItem, TFilterCategoryKey> {
  placeholderText: string;
}

export type FilterCategory<TItem, TFilterCategoryKey extends string> =
  | IMultiselectFilterCategory<TItem, TFilterCategoryKey>
  | ISelectFilterCategory<TItem, TFilterCategoryKey>
  | ISearchFilterCategory<TItem, TFilterCategoryKey>;

export type IFilterValues<TFilterCategoryKey extends string> = Partial<
  Record<TFilterCategoryKey, FilterValue>
>;

export const getFilterLogicOperator = <
  TItem,
  TFilterCategoryKey extends string
>(
  filterCategory?: FilterCategory<TItem, TFilterCategoryKey>,
  defaultOperator: "AND" | "OR" = "OR"
) =>
  (filterCategory &&
    (filterCategory as IMultiselectFilterCategory<TItem, TFilterCategoryKey>)
      .logicOperator) ||
  defaultOperator;

export interface IFilterToolbarProps<TItem, TFilterCategoryKey extends string> {
  filterCategories: FilterCategory<TItem, TFilterCategoryKey>[];
  filterValues: IFilterValues<TFilterCategoryKey>;
  setFilterValues: (values: IFilterValues<TFilterCategoryKey>) => void;
  beginToolbarItems?: JSX.Element;
  endToolbarItems?: JSX.Element;
  pagination?: JSX.Element;
  showFiltersSideBySide?: boolean;
}

export const FilterToolbar = <TItem, TFilterCategoryKey extends string>({
  filterCategories,
  filterValues,
  setFilterValues,
  pagination,
  showFiltersSideBySide = false,
}: React.PropsWithChildren<
  IFilterToolbarProps<TItem, TFilterCategoryKey>
>): JSX.Element | null => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    React.useState(false);
  const [currenTFilterCategoryKey, setCurrenTFilterCategoryKey] =
    React.useState(filterCategories[0].key);

  const onCategorySelect = (
    category: FilterCategory<TItem, TFilterCategoryKey>
  ) => {
    setCurrenTFilterCategoryKey(category.key);
    setIsCategoryDropdownOpen(false);
  };

  const setFilterValue = (
    category: FilterCategory<TItem, TFilterCategoryKey>,
    newValue: FilterValue
  ) => setFilterValues({ ...filterValues, [category.key]: newValue });

  const currentFilterCategory = filterCategories.find(
    (category) => category.key === currenTFilterCategoryKey
  );

  return (
    <>
      <ToolbarToggleGroup
        variant="filter-group"
        toggleIcon={<FilterIcon />}
        breakpoint="2xl"
        spaceItems={
          showFiltersSideBySide ? { default: "spaceItemsMd" } : undefined
        }
      >
        {!showFiltersSideBySide && (
          <ToolbarItem>
            <Dropdown
              toggle={
                <DropdownToggle
                  id="filtered-by"
                  onToggle={() =>
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  }
                >
                  <FilterIcon /> {currentFilterCategory?.title}
                </DropdownToggle>
              }
              isOpen={isCategoryDropdownOpen}
              dropdownItems={filterCategories.map((category) => (
                <DropdownItem
                  id={`filter-category-${category.key}`}
                  key={category.key}
                  onClick={() => onCategorySelect(category)}
                >
                  {category.title}
                </DropdownItem>
              ))}
            />
          </ToolbarItem>
        )}

        {filterCategories.map((category) => (
          <FilterControl<TItem, TFilterCategoryKey>
            key={category.key}
            category={category}
            filterValue={filterValues[category.key]}
            setFilterValue={(newValue) => setFilterValue(category, newValue)}
            showToolbarItem={
              showFiltersSideBySide ||
              currentFilterCategory?.key === category.key
            }
          />
        ))}
      </ToolbarToggleGroup>
      {pagination ? (
        <ToolbarItem variant="pagination">{pagination}</ToolbarItem>
      ) : null}
    </>
  );
};
