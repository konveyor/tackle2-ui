import * as React from "react";
import { ToolbarFilter } from "@patternfly/react-core";
import {
  Select,
  SelectOption,
  SelectOptionObject,
} from "@patternfly/react-core/deprecated";
import { IFilterControlProps } from "./FilterControl";
import {
  ISelectFilterCategory,
  FilterSelectOptionProps,
} from "./FilterToolbar";
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

  const getOptionKeyFromOptionValue = (
    optionValue: string | SelectOptionObject
  ) =>
    category.selectOptions.find(
      (optionProps) => optionProps.value === optionValue
    )?.key;

  const getChipFromOptionValue = (
    optionValue: string | SelectOptionObject | undefined
  ) => (optionValue ? optionValue.toString() : "");

  const getOptionKeyFromChip = (chip: string) =>
    category.selectOptions.find(
      (optionProps) => optionProps.value.toString() === chip
    )?.key;

  const getOptionValueFromOptionKey = (optionKey: string) =>
    category.selectOptions.find((optionProps) => optionProps.key === optionKey)
      ?.value;

  const onFilterSelect = (value: string | SelectOptionObject) => {
    const optionKey = getOptionKeyFromOptionValue(value);
    setFilterValue(optionKey ? [optionKey] : null);
    setIsFilterDropdownOpen(false);
  };

  const onFilterClear = (chip: string) => {
    const optionKey = getOptionKeyFromChip(chip);
    const newValue = filterValue
      ? filterValue.filter((val) => val !== optionKey)
      : [];
    setFilterValue(newValue.length > 0 ? newValue : null);
  };

  // Select expects "selections" to be an array of the "value" props from the relevant optionProps
  const selections = filterValue
    ? filterValue.map(getOptionValueFromOptionKey)
    : null;

  const chips = selections ? selections.map(getChipFromOptionValue) : [];

  const renderSelectOptions = (options: FilterSelectOptionProps[]) =>
    options.map((optionProps) => (
      <SelectOption {...optionProps} key={optionProps.key} />
    ));

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
        toggleId={`${category.key}-filter-value-select`}
        onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        selections={selections || []}
        onSelect={(_, value) => onFilterSelect(value)}
        isOpen={isFilterDropdownOpen}
        placeholderText="Any"
        isDisabled={isDisabled || category.selectOptions.length === 0}
      >
        {renderSelectOptions(category.selectOptions)}
      </Select>
    </ToolbarFilter>
  );
};
