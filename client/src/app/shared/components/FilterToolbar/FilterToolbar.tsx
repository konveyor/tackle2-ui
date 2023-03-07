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

export interface IBasicFilterCategory<T> {
  key: string;
  title: string;
  type: FilterType; // If we want to support arbitrary filter types, this could be a React node that consumes context instead of an enum
  getItemValue?: (item: T) => string | boolean;
}

export interface IMultiselectFilterCategory<T> extends IBasicFilterCategory<T> {
  selectOptions: OptionPropsWithKey[];
  logicOperator?: "AND" | "OR";
}

export interface ISelectFilterCategory<T> extends IBasicFilterCategory<T> {
  selectOptions: OptionPropsWithKey[];
}

export interface ISearchFilterCategory<T> extends IBasicFilterCategory<T> {
  placeholderText: string;
}

export type FilterCategory<T> =
  | IMultiselectFilterCategory<T>
  | ISelectFilterCategory<T>
  | ISearchFilterCategory<T>;

export interface IFilterValues {
  [categoryKey: string]: FilterValue;
}

export interface IFilterToolbarProps<T> {
  filterCategories: FilterCategory<T>[];
  filterValues: IFilterValues;
  setFilterValues: (values: IFilterValues) => void;
  beginToolbarItems?: JSX.Element;
  endToolbarItems?: JSX.Element;
  pagination?: JSX.Element;
  showFiltersSideBySide?: boolean;
}

export const FilterToolbar = <T,>({
  filterCategories,
  filterValues,
  setFilterValues,
  pagination,
  showFiltersSideBySide = false,
}: React.PropsWithChildren<IFilterToolbarProps<T>>): JSX.Element | null => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    React.useState(false);
  const [currentCategoryKey, setCurrentCategoryKey] = React.useState(
    filterCategories[0].key
  );

  const onCategorySelect = (category: FilterCategory<T>) => {
    setCurrentCategoryKey(category.key);
    setIsCategoryDropdownOpen(false);
  };

  const setFilterValue = (category: FilterCategory<T>, newValue: FilterValue) =>
    setFilterValues({ ...filterValues, [category.key]: newValue });

  const currentFilterCategory = filterCategories.find(
    (category) => category.key === currentCategoryKey
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
          <FilterControl<T>
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
