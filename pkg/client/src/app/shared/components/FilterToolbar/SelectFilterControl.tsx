import * as React from "react";
import {
  ToolbarFilter,
  Select,
  SelectOption,
  SelectOptionObject,
} from "@patternfly/react-core";
import { IFilterControlProps } from "./FilterControl";
import { ISelectFilterCategory } from "./FilterToolbar";

export interface ISelectFilterControlProps<T> extends IFilterControlProps<T> {
  category: ISelectFilterCategory<T>;
}

export const SelectFilterControl = <T,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
}: React.PropsWithChildren<
  ISelectFilterControlProps<T>
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
    // Currently this implements single-select, multiple-select is also a design option.
    // If we need multi-select filters in the future we can add that support here.
    // https://www.patternfly.org/v4/design-guidelines/usage-and-behavior/filters#attribute-value-textbox-filters
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

  return (
    <ToolbarFilter
      chips={chips}
      deleteChip={(_, chip) => onFilterClear(chip as string)}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        aria-label={category.title}
        onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        selections={selections || []}
        onSelect={(_, value) => onFilterSelect(value)}
        isOpen={isFilterDropdownOpen}
        placeholderText="Any"
      >
        {category.selectOptions.map((optionProps) => (
          <SelectOption {...optionProps} key={optionProps.key} />
        ))}
      </Select>
    </ToolbarFilter>
  );
};
