import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";
import { ToolbarProps } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";

// Args that should be passed into useTableControlProps
export interface IFilterPropHelpersExternalArgs<
  TItem,
  TFilterCategoryKey extends string,
> {
  filterState: IFilterState<TFilterCategoryKey>;
  filterCategories?: FilterCategory<TItem, TFilterCategoryKey>[];
}

export const useFilterPropHelpers = <TItem, TFilterCategoryKey extends string>(
  args: IFilterPropHelpersExternalArgs<TItem, TFilterCategoryKey>
) => {
  const { t } = useTranslation();

  const {
    filterState: { filterValues, setFilterValues },
    filterCategories = [],
  } = args;

  const filterPropsForToolbar: ToolbarProps = {
    collapseListedFiltersBreakpoint: "xl",
    clearAllFilters: () => setFilterValues({}),
    clearFiltersButtonText: t("actions.clearAllFilters"),
  };

  const propsForFilterToolbar: IFilterToolbarProps<TItem, TFilterCategoryKey> =
    {
      filterCategories,
      filterValues,
      setFilterValues,
    };

  // TODO fix the confusing naming here... we have FilterToolbar and Toolbar which both have filter-related props
  return { filterPropsForToolbar, propsForFilterToolbar };
};
