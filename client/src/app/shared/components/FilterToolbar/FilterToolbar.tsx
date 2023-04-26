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
  TCategoryKey extends string // Unique identifiers for each filter category (inferred from key properties if possible)
> {
  key: TCategoryKey;
  title: string;
  type: FilterType; // If we want to support arbitrary filter types, this could be a React node that consumes context instead of an enum
  getItemValue?: (item: TItem) => string | boolean;
}

export interface IMultiselectFilterCategory<TItem, TCategoryKey extends string>
  extends IBasicFilterCategory<TItem, TCategoryKey> {
  selectOptions: OptionPropsWithKey[];
  placeholderText?: string;
  logicOperator?: "AND" | "OR";
}

export interface ISelectFilterCategory<TItem, TCategoryKey extends string>
  extends IBasicFilterCategory<TItem, TCategoryKey> {
  selectOptions: OptionPropsWithKey[];
}

export interface ISearchFilterCategory<TItem, TCategoryKey extends string>
  extends IBasicFilterCategory<TItem, TCategoryKey> {
  placeholderText: string;
}

export type FilterCategory<TItem, TCategoryKey extends string> =
  | IMultiselectFilterCategory<TItem, TCategoryKey>
  | ISelectFilterCategory<TItem, TCategoryKey>
  | ISearchFilterCategory<TItem, TCategoryKey>;

export type IFilterValues<TCategoryKey extends string> = Partial<
  Record<TCategoryKey, FilterValue>
>;

export interface IFilterToolbarProps<TItem, TCategoryKey extends string> {
  filterCategories: FilterCategory<TItem, TCategoryKey>[];
  filterValues: IFilterValues<TCategoryKey>;
  setFilterValues: (values: IFilterValues<TCategoryKey>) => void;
  beginToolbarItems?: JSX.Element;
  endToolbarItems?: JSX.Element;
  pagination?: JSX.Element;
  showFiltersSideBySide?: boolean;
}

export const FilterToolbar = <TItem, TCategoryKey extends string>({
  filterCategories,
  filterValues,
  setFilterValues,
  pagination,
  showFiltersSideBySide = false,
}: React.PropsWithChildren<
  IFilterToolbarProps<TItem, TCategoryKey>
>): JSX.Element | null => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] =
    React.useState(false);
  const [currentCategoryKey, setCurrentCategoryKey] = React.useState(
    filterCategories[0].key
  );

  const onCategorySelect = (category: FilterCategory<TItem, TCategoryKey>) => {
    setCurrentCategoryKey(category.key);
    setIsCategoryDropdownOpen(false);
  };

  const setFilterValue = (
    category: FilterCategory<TItem, TCategoryKey>,
    newValue: FilterValue
  ) => setFilterValues({ ...filterValues, [category.key]: newValue });

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
          <FilterControl<TItem>
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
