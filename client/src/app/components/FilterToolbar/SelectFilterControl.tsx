import * as React from "react";
import {
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  SelectOptionProps,
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

  const getChipFromOptionValue = (
    optionValue: SelectOptionProps | undefined
  ) => {
    return optionValue ? optionValue.value : "";
  };

  const getOptionKeyFromChip = (chip: string) =>
    category.selectOptions.find(
      (optionProps) => optionProps.value.toString() === chip
    )?.key;

  const getOptionValueFromOptionKey = (
    optionKey: string
  ): SelectOptionProps => {
    return (
      category.selectOptions.find((optionProps) => {
        return optionProps.value === optionKey;
      }) || { value: "", children: "", key: "" }
    );
  };

  const onFilterSelect = (value: string) => {
    setFilterValue(value ? [value] : null);
    setIsFilterDropdownOpen(false);
  };

  const onFilterClear = (chip: string) => {
    const optionKey = getOptionKeyFromChip(chip);
    const newValue = filterValue
      ? filterValue.filter((val) => val !== optionKey)
      : [];
    setFilterValue(newValue.length > 0 ? newValue : null);
  };

  const selections: SelectOptionProps[] = filterValue
    ? filterValue.map(getOptionValueFromOptionKey)
    : [];

  const chips = selections ? selections.map(getChipFromOptionValue) : [];

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => {
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
        {filterValue || "Any"}
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
      >
        <SelectList>
          {category.selectOptions.map((o: SelectOptionProps, index) => {
            return (
              <SelectOption
                key={`${index}-${o.value}`}
                isSelected={o.value == filterValue}
                {...o}
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
