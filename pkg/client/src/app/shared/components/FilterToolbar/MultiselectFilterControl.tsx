import * as React from "react";
import {
  ToolbarFilter,
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
} from "@patternfly/react-core";
import { IFilterControlProps } from "./FilterControl";
import {
  IMultiselectFilterCategory,
  ISelectFilterCategory,
} from "./FilterToolbar";

export interface IMultiselectFilterControlProps<T>
  extends IFilterControlProps<T> {
  category: IMultiselectFilterCategory<T>;
}

export const MultiselectFilterControl = <T,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
}: React.PropsWithChildren<
  IMultiselectFilterControlProps<T>
>): JSX.Element | null => {
  console.log("filterValue", filterValue);
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
    console.log("filterValue n sel", filterValue);
    console.log("value n sel", value);
    const optionKey = getOptionKeyFromOptionValue(value);
    // Currently this implements single-select, multiple-select is also a design option.
    // If we need multi-select filters in the future we can add that support here.
    // https://www.patternfly.org/v4/design-guidelines/usage-and-behavior/filters#attribute-value-textbox-filters
    // setFilterValue(optionKey ? [optionKey] : null);
    if (optionKey && filterValue?.includes(optionKey)) {
      let updatedValues = filterValue.filter(
        (item: string) => item !== optionKey
      );
      console.log("updatedValues", updatedValues);
      setFilterValue(updatedValues);
    } else {
      if (filterValue) {
        let updatedValues = [...filterValue, optionKey];
        // setSelected((prevState: string[]) => [...prevState, value as string]);
        console.log("updatedValues", updatedValues);
        setFilterValue(updatedValues as string[]);
      } else {
        setFilterValue([optionKey || ""]);
      }
    }
    // setIsFilterDropdownOpen(false);
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
        chipGroupProps={{
          numChips: 1,
          expandedText: "Hide",
          collapsedText: "Show ${remaining}",
        }}
        variant={SelectVariant.typeaheadMulti}
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
