import * as React from "react";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  ToolbarChip,
  ToolbarFilter,
} from "@patternfly/react-core";
import { IFilterControlProps } from "./FilterControl";
import { ISelectFilterCategory } from "./FilterToolbar";
import { css } from "@patternfly/react-styles";

import "./select-overrides.css";

export interface ISelectFilterControlProps<
  TItem,
  TFilterCategoryKey extends string,
> extends IFilterControlProps<TItem, TFilterCategoryKey> {
  category: ISelectFilterCategory<TItem, TFilterCategoryKey>;
  isScrollable?: boolean;
}

export const SelectFilterControl = <TItem, TFilterCategoryKey extends string>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
  isDisabled = false,
  isScrollable = false,
}: ISelectFilterControlProps<
  TItem,
  TFilterCategoryKey
>): JSX.Element | null => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);

  const getOptionFromOptionValue = (optionValue: string) =>
    category.selectOptions.find(({ value }) => value === optionValue);

  const chips = filterValue
    ?.map((value) => {
      const option = getOptionFromOptionValue(value);
      if (!option) {
        return null;
      }
      const { chipLabel, label } = option;
      return {
        key: value,
        node: chipLabel ?? label ?? value,
      } as ToolbarChip;
    })
    .filter(Boolean);

  const onFilterSelect = (value: string) => {
    const option = getOptionFromOptionValue(value);
    setFilterValue(option ? [value] : null);
    setIsFilterDropdownOpen(false);
  };

  const onFilterClear = (chip: string | ToolbarChip) => {
    const chipValue = typeof chip === "string" ? chip : chip.key;
    const newValue = filterValue?.filter((val) => val !== chipValue);
    setFilterValue(newValue?.length ? newValue : null);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => {
    let displayText = "Any";
    if (filterValue && filterValue.length > 0) {
      const selectedKey = filterValue[0];
      const selectedDisplayValue = getOptionFromOptionValue(selectedKey)?.label;
      displayText = selectedDisplayValue ? selectedDisplayValue : selectedKey;
    }

    return (
      <MenuToggle
        aria-label={"Select"}
        id={"select-filter-value-select"}
        isFullWidth
        ref={toggleRef}
        onClick={() => {
          setIsFilterDropdownOpen(!isFilterDropdownOpen);
        }}
        isExpanded={isFilterDropdownOpen}
        isDisabled={isDisabled || category.selectOptions.length === 0}
      >
        {displayText}
      </MenuToggle>
    );
  };

  return (
    <ToolbarFilter
      id={`filter-control-${category.categoryKey}`}
      chips={chips}
      deleteChip={(_, chip) => onFilterClear(chip)}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        className={css(isScrollable && "isScrollable")}
        aria-label={category.title}
        toggle={toggle}
        onOpenChange={(isOpen) => setIsFilterDropdownOpen(isOpen)}
        selected={filterValue}
        onSelect={(_, value) => {
          onFilterSelect(value as string);
          setIsFilterDropdownOpen(false);
        }}
        isOpen={isFilterDropdownOpen}
        shouldFocusToggleOnSelect
      >
        <SelectList>
          {category.selectOptions.map(({ label, value, optionProps }) => {
            const isSelected = filterValue?.includes(value);
            return (
              <SelectOption
                {...optionProps}
                key={value}
                value={value}
                isSelected={isSelected}
              >
                {label ?? value}
              </SelectOption>
            );
          })}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );
};
