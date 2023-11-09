import * as React from "react";
import { ToolbarFilter } from "@patternfly/react-core";
import {
  Select,
  SelectOption,
  SelectOptionObject,
  SelectVariant,
  SelectProps,
  SelectGroup,
} from "@patternfly/react-core/deprecated";
import { IFilterControlProps } from "./FilterControl";
import {
  IMultiselectFilterCategory,
  FilterSelectOptionProps,
} from "./FilterToolbar";
import { css } from "@patternfly/react-styles";

import "./select-overrides.css";

export interface IMultiselectFilterControlProps<TItem>
  extends IFilterControlProps<TItem, string> {
  category: IMultiselectFilterCategory<TItem, string>;
  isScrollable?: boolean;
}

export const MultiselectFilterControl = <TItem,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
  isDisabled = false,
  isScrollable = false,
}: React.PropsWithChildren<
  IMultiselectFilterControlProps<TItem>
>): JSX.Element | null => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);

  const { selectOptions } = category;
  const hasGroupings = !Array.isArray(selectOptions);
  const flatOptions = !hasGroupings
    ? selectOptions
    : Object.values(selectOptions).flatMap((i) => i);

  const getOptionKeyFromOptionValue = (
    optionValue: string | SelectOptionObject
  ) => flatOptions.find(({ value }) => value === optionValue)?.key;

  const getOptionKeyFromChip = (chip: string) =>
    flatOptions.find(({ value }) => value.toString() === chip)?.key;

  const getOptionValueFromOptionKey = (optionKey: string) =>
    flatOptions.find(({ key }) => key === optionKey)?.value;

  const onFilterSelect = (value: string | SelectOptionObject) => {
    const optionKey = getOptionKeyFromOptionValue(value);
    if (optionKey && filterValue?.includes(optionKey)) {
      const updatedValues = filterValue.filter(
        (item: string) => item !== optionKey
      );
      setFilterValue(updatedValues);
    } else {
      if (filterValue) {
        const updatedValues = [...filterValue, optionKey];
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
  const selections = filterValue?.map(getOptionValueFromOptionKey) ?? [];

  // TODO: Chips could be a `ToolbarChip` instead of a `string` and embed a tooltip.
  // TODO: However, the selections value would need to be more specific to be able to
  // TODO: map a group name to a specific select option (assuming that an item with the
  // TODO: same name can exist in multiple groups)
  const chips = selections.map((s) => s?.toString() ?? "");

  const renderSelectOptions = (
    filter: (option: FilterSelectOptionProps, groupName?: string) => boolean
  ) =>
    hasGroupings
      ? Object.entries(selectOptions)
          .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
          .map(([group, options], index) => {
            const groupFiltered =
              options?.filter((o) => filter(o, group)) ?? [];
            return groupFiltered.length == 0 ? undefined : (
              <SelectGroup key={`group-${index}`} label={group}>
                {groupFiltered.map((optionProps) => (
                  <SelectOption {...optionProps} key={optionProps.key} />
                ))}
              </SelectGroup>
            );
          })
          .filter(Boolean)
      : flatOptions
          .filter((o) => filter(o))
          .map((optionProps) => (
            <SelectOption {...optionProps} key={optionProps.key} />
          ));

  /**
   * Render options (with categories if available) where the option value OR key includes
   * the filterInput.
   */
  const onOptionsFilter: SelectProps["onFilter"] = (_event, textInput) => {
    const input = textInput?.toLowerCase();

    return renderSelectOptions((optionProps, groupName) => {
      if (!input) return false;

      // TODO: Checking for a filter match against the key or the value may not be desirable.
      return (
        groupName?.toLowerCase().includes(input) ||
        optionProps?.key?.toLowerCase().includes(input) ||
        optionProps?.value?.toString().toLowerCase().includes(input)
      );
    });
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
        toggleId={`${category.key}-filter-value-select`}
        onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        selections={selections || []}
        onSelect={(_, value) => onFilterSelect(value)}
        isOpen={isFilterDropdownOpen}
        placeholderText={category.placeholderText}
        isDisabled={isDisabled || category.selectOptions.length === 0}
        variant={SelectVariant.checkbox}
        hasInlineFilter
        onFilter={onOptionsFilter}
      >
        {renderSelectOptions(() => true)}
      </Select>
    </ToolbarFilter>
  );
};
