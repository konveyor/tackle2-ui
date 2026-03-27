import { ToolbarLabel, ToolbarFilter } from "@patternfly/react-core";

import { IFilterControlProps } from "./FilterControl";
import { ISelectFilterCategory } from "./FilterToolbar";
import SimpleSelect from "./components/SimpleSelect";

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
  const getOptionFromOptionValue = (optionValue: string) =>
    category.selectOptions.find(({ value }) => value === optionValue);

  const labels = filterValue
    ?.map((value) => {
      const option = getOptionFromOptionValue(value);
      if (!option) {
        return null;
      }
      const { chipLabel, label } = option;
      return {
        key: value,
        node: chipLabel ?? label ?? value,
      } as ToolbarLabel;
    })
    .filter(Boolean);

  const onFilterSelect = (value: string) => {
    const option = getOptionFromOptionValue(value);
    setFilterValue(option ? [value] : null);
  };

  const onFilterClear = (label: string | ToolbarLabel) => {
    const labelValue = typeof label === "string" ? label : label.key;
    const newValue = filterValue?.filter((val) => val !== labelValue);
    setFilterValue(newValue?.length ? newValue : null);
  };

  return (
    <ToolbarFilter
      id={`filter-control-${category.categoryKey}`}
      labels={labels}
      deleteLabel={(_, label) => onFilterClear(label)}
      categoryName={category.title}
      showToolbarItem={showToolbarItem}
    >
      <SimpleSelect
        isScrollable={isScrollable}
        options={category.selectOptions}
        value={filterValue?.[0]}
        onSelect={onFilterSelect}
        ariaLabel={category.title}
        isDisabled={isDisabled}
        placeholderText="Any"
        toggleId="select-filter-value-select"
        toggleAriaLabel="Select"
      />
    </ToolbarFilter>
  );
};
