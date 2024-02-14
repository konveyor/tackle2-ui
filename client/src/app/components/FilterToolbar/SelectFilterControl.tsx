import * as React from "react";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
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
}: React.PropsWithChildren<
  ISelectFilterControlProps<TItem, TFilterCategoryKey>
>): JSX.Element | null => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);

  const getOptionKeyFromOptionValue = (optionValue: string) =>
    category.selectOptions.find(({ value }) => value === optionValue)?.key;

  const getOptionValueFromOptionKey = (optionKey: string) =>
    category.selectOptions.find(({ key }) => key === optionKey)?.value;

  const chips = filterValue?.map((key) => {
    const displayValue = getOptionValueFromOptionKey(key);
    return displayValue ? displayValue : key;
  });

  const onFilterSelect = (value: string) => {
    const optionKey = getOptionKeyFromOptionValue(value);
    setFilterValue(optionKey ? [optionKey] : null);
    setIsFilterDropdownOpen(false);
  };

  const onFilterClear = (chip: string) => {
    const newValue = filterValue?.filter((val) => val !== chip);
    setFilterValue(newValue?.length ? newValue : null);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => {
    let displayText = "Any";
    if (filterValue && filterValue.length > 0) {
      const selectedKey = filterValue[0];
      const selectedDisplayValue = getOptionValueFromOptionKey(selectedKey);
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
      id={`filter-control-${category.key}`}
      chips={chips}
      deleteChip={(_, chip) => onFilterClear(chip as string)}
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
        placeholder="Any"
        shouldFocusToggleOnSelect
      >
        <SelectList>
          {category.selectOptions.map((o, index) => {
            const isSelected = filterValue?.includes(o.key);
            return (
              <SelectOption
                {...o}
                key={`${index}-${o.value}`}
                isSelected={isSelected}
              >
                {o.value}
              </SelectOption>
            );
          })}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );
};
