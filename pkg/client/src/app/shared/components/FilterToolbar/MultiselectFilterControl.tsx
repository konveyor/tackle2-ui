import * as React from "react";
import {
  ToolbarFilter,
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  SelectProps,
} from "@patternfly/react-core";
import { IFilterControlProps } from "./FilterControl";
import {
  IMultiselectFilterCategory,
  OptionPropsWithKey,
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
    if (optionKey && filterValue?.includes(optionKey)) {
      let updatedValues = filterValue.filter(
        (item: string) => item !== optionKey
      );
      setFilterValue(updatedValues);
    } else {
      if (filterValue) {
        let updatedValues = [...filterValue, optionKey];
        setFilterValue(updatedValues as string[]);
      } else {
        setFilterValue([optionKey || ""]);
      }
    }
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

  const renderSelectOptions = (options: OptionPropsWithKey[]) =>
    options.map((optionProps) => (
      <SelectOption {...optionProps} key={optionProps.key} />
    ));

  const onOptionsFilter: SelectProps["onFilter"] = (_event, textInput) =>
    renderSelectOptions(
      category.selectOptions.filter((optionProps) => {
        // Note: This is filtering on the `key`, not the `value`, since the `value` isn't necessarily a string.
        // So that assumes your key is an actual string representation of what's shown on screen (usually matching the value)
        // which could become a problem maybe?
        return optionProps?.key.toLowerCase().includes(textInput.toLowerCase());
      })
    );

  return (
    <ToolbarFilter
      chips={chips}
      deleteChip={(_, chip) => onFilterClear(chip as string)}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <Select
        variant={SelectVariant.checkbox}
        aria-label={category.title}
        toggleId={`${category.key}-filter-value-select`}
        onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        selections={selections || []}
        onSelect={(_, value) => onFilterSelect(value)}
        isOpen={isFilterDropdownOpen}
        placeholderText={`Filter by ${category.title
          .charAt(0)
          .toLowerCase()}${category.title.slice(1)}`}
        hasInlineFilter
        onFilter={onOptionsFilter}
      >
        {renderSelectOptions(category.selectOptions)}
      </Select>
    </ToolbarFilter>
  );
};
