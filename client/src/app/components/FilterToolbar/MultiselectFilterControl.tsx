import { ToolbarChip, ToolbarFilter } from "@patternfly/react-core";

import { IFilterControlProps } from "./FilterControl";
import {
  FilterSelectOptionProps,
  IMultiselectFilterCategory,
} from "./FilterToolbar";

import "./select-overrides.css";
import { MultiSelect } from "./components/MultiSelect";

export interface IMultiselectFilterControlProps<TItem>
  extends IFilterControlProps<TItem, string> {
  category: IMultiselectFilterCategory<TItem, string>;
  isScrollable?: boolean;
}

const NO_RESULTS = "no-results";

export const MultiselectFilterControl = <TItem,>({
  category,
  filterValue,
  setFilterValue,
  showToolbarItem,
  isDisabled = false,
}: IMultiselectFilterControlProps<TItem>): JSX.Element | null => {
  const idPrefix = `filter-control-${category.categoryKey}-group`;
  const defaultGroup = category.title;

  const [firstGroup, ...otherGroups] = [
    ...new Set([
      ...(category.selectOptions
        ?.map(({ groupLabel }) => groupLabel)
        .filter(Boolean) ?? []),
      defaultGroup,
    ]),
  ];

  const onFilterClearGroup = (groupName: string) =>
    setFilterValue(
      filterValue
        ?.map((filter): [string, FilterSelectOptionProps | undefined] => [
          filter,
          category.selectOptions?.find(({ value }) => filter === value),
        ])
        .filter(([, option]) => option)
        .map(([filter, { groupLabel = defaultGroup } = {}]) => [
          filter,
          groupLabel,
        ])
        .filter(([, groupLabel]) => groupLabel != groupName)
        .map(([filter]) => filter)
    );
  const onFilterClear = (chip: string | ToolbarChip) => {
    const value = typeof chip === "string" ? chip : chip.key;

    if (value) {
      const newValue = filterValue?.filter((val) => val !== value) ?? [];
      setFilterValue(newValue.length > 0 ? newValue : null);
    }
  };

  /*
   * Note: Create chips only as `ToolbarChip` (no plain string)
   */
  const chipsFor = (groupName: string) =>
    filterValue
      ?.map((filter) =>
        category.selectOptions.find(
          ({ value, groupLabel = defaultGroup }) =>
            value === filter && groupLabel === groupName
        )
      )
      .filter(Boolean)
      .map((option) => {
        const { chipLabel, label, value } = option;
        const displayValue: string = chipLabel ?? label ?? value ?? "";

        return {
          key: value,
          node: displayValue,
        };
      });

  const onSelect = (value: string | undefined) => {
    if (!value || value === NO_RESULTS) {
      return;
    }

    const newFilterValue: string[] = filterValue?.includes(value)
      ? filterValue.filter((item) => item !== value)
      : [...(filterValue ?? []), value];

    setFilterValue(newFilterValue);
  };

  const withGroupPrefix = (group: string) =>
    group === category.title ? group : `${category.title}/${group}`;

  return (
    <>
      {
        <ToolbarFilter
          id={`${idPrefix}-${firstGroup}`}
          chips={chipsFor(firstGroup)}
          deleteChip={(_, chip) => onFilterClear(chip)}
          deleteChipGroup={() => onFilterClearGroup(firstGroup)}
          categoryName={{ name: firstGroup, key: withGroupPrefix(firstGroup) }}
          key={withGroupPrefix(firstGroup)}
          showToolbarItem={showToolbarItem}
        >
          <MultiSelect
            aria-label={category.title}
            values={filterValue ?? undefined}
            onSelect={onSelect}
            toggleId={`filter-for-${category.categoryKey}`}
            toggleAriaLabel={category.title}
            isDisabled={isDisabled || !category.selectOptions.length}
            hasCheckbox={true}
            hasBadge={true}
            placeholderText={category.placeholderText}
            showSelectedInToggle={false}
            closeMenuOnSelect={false}
            options={category.selectOptions}
          />
        </ToolbarFilter>
      }
      {otherGroups.map((groupName) => (
        <ToolbarFilter
          id={`${idPrefix}-${groupName}`}
          chips={chipsFor(groupName)}
          deleteChip={(_, chip) => onFilterClear(chip)}
          deleteChipGroup={() => onFilterClearGroup(groupName)}
          categoryName={{ name: groupName, key: withGroupPrefix(groupName) }}
          key={withGroupPrefix(groupName)}
          showToolbarItem={false}
        >
          {" "}
        </ToolbarFilter>
      ))}
    </>
  );
};
