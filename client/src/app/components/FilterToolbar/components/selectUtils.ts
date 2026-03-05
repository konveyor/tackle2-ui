import { FilterSelectOptionProps } from "../FilterToolbar";

const NO_RESULTS = "no-results";

export const getDisplayValue = (
  value: string,
  options: FilterSelectOptionProps[]
) => {
  const option = options.find((option) => option.value === value);
  return toDisplayValue(option);
};

export const toDisplayValue = (option?: FilterSelectOptionProps) => {
  return option?.label ?? option?.value ?? "";
};

export const noResultsId = (categoryKey: string) =>
  createItemId(NO_RESULTS, categoryKey);

export const createItemId = (partialId: number | string, categoryKey: string) =>
  `select-${categoryKey}-${partialId}`;

export const getStableIndex = (
  value: unknown,
  options: FilterSelectOptionProps[]
) => {
  return options.findIndex((option) => option.value === value);
};
