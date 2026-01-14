import { DateRangeFilter } from "./DateRangeFilter";
import {
  FilterCategory,
  FilterType,
  FilterValue,
  IMultiselectFilterCategory,
  ISearchFilterCategory,
  ISelectFilterCategory,
} from "./FilterToolbar";
import { MultiselectFilterControl } from "./MultiselectFilterControl";
import { SearchFilterControl } from "./SearchFilterControl";
import { SelectFilterControl } from "./SelectFilterControl";

export interface IFilterControlProps<TItem, TFilterCategoryKey extends string> {
  category: FilterCategory<TItem, TFilterCategoryKey>;
  filterValue: FilterValue;
  setFilterValue: (newValue: FilterValue) => void;
  showToolbarItem: boolean;
  isDisabled?: boolean;
}

export const FilterControl = <TItem, TFilterCategoryKey extends string>({
  category,
  ...props
}: IFilterControlProps<TItem, TFilterCategoryKey>): JSX.Element | null => {
  if (category.type === FilterType.select) {
    return (
      <SelectFilterControl
        isScrollable
        category={category as ISelectFilterCategory<TItem, TFilterCategoryKey>}
        {...props}
      />
    );
  }
  if (
    category.type === FilterType.search ||
    category.type === FilterType.numsearch
  ) {
    return (
      <SearchFilterControl
        category={category as ISearchFilterCategory<TItem, TFilterCategoryKey>}
        isNumeric={category.type === FilterType.numsearch}
        {...props}
      />
    );
  }
  if (category.type === FilterType.multiselect) {
    return (
      <MultiselectFilterControl
        isScrollable
        category={
          category as IMultiselectFilterCategory<TItem, TFilterCategoryKey>
        }
        {...props}
      />
    );
  }
  if (category.type === FilterType.dateRange) {
    return <DateRangeFilter category={category} {...props} />;
  }
  return null;
};
