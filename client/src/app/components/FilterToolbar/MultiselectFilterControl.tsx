import * as React from "react";
import { ToolbarChip, ToolbarFilter, Tooltip } from "@patternfly/react-core";
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

const CHIP_BREAK_DELINEATOR = " / ";

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

  const onFilterClear = (chip: string | ToolbarChip) => {
    const chipKey = typeof chip === "string" ? chip : chip.key;
    const optionKey = getOptionKeyFromChip(chipKey);
    const newValue = filterValue
      ? filterValue.filter((val) => val !== optionKey)
      : [];
    setFilterValue(newValue.length > 0 ? newValue : null);
  };

  // Select expects "selections" to be an array of the "value" props from the relevant optionProps
  const selections = filterValue?.map(getOptionValueFromOptionKey) ?? [];

  /*
   * Note: Chips can be a `ToolbarChip` or a plain `string`.  Use a hack to split a
   *       selected option in 2 parts.  Assuming the option is in the format "Group / Item"
   *       break the text and show a chip with the Item and the Group as a tooltip.
   */
  const chips = selections.map((s, index) => {
    const chip: string = s?.toString() ?? "";
    const idx = chip.indexOf(CHIP_BREAK_DELINEATOR);

    if (idx > 0) {
      const tooltip = chip.substring(0, idx);
      const text = chip.substring(idx + CHIP_BREAK_DELINEATOR.length);
      return {
        key: chip,
        node: (
          <Tooltip id={`tooltip-chip-${index}`} content={<div>{tooltip}</div>}>
            <div>{text}</div>
          </Tooltip>
        ),
      } as ToolbarChip;
    }
    return chip;
  });

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
      deleteChip={(_, chip) => onFilterClear(chip)}
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
