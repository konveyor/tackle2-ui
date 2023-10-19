import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/components/FilterToolbar";
import { IFilterState } from "./useFilterState";
import { ToolbarProps } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { DiscriminatedArgs } from "@app/utils/type-utils";

// Args that should be passed into useTableControlProps
export type IFilterPropHelpersExternalArgs<
  TItem,
  TFilterCategoryKey extends string,
> = DiscriminatedArgs<
  "isFilterEnabled",
  {
    filterState: IFilterState<TFilterCategoryKey>;
    filterCategories: FilterCategory<TItem, TFilterCategoryKey>[];
  }
>;

// TODO fix the confusing naming here... we have FilterToolbar and Toolbar which both have filter-related props
export type IFilterPropHelpers<TItem, TFilterCategoryKey extends string> = {
  filterPropsForToolbar: ToolbarProps;
  propsForFilterToolbar: IFilterToolbarProps<TItem, TFilterCategoryKey>;
};

export const useFilterPropHelpers = <TItem, TFilterCategoryKey extends string>(
  args: IFilterPropHelpersExternalArgs<TItem, TFilterCategoryKey>
): IFilterPropHelpers<TItem, TFilterCategoryKey> => {
  const { t } = useTranslation();

  if (!args.isFilterEnabled) {
    return {
      filterPropsForToolbar: {},
      propsForFilterToolbar: {
        filterCategories: [],
        filterValues: {},
        setFilterValues: () => {},
      },
    };
  }

  const {
    filterState: { filterValues, setFilterValues },
    filterCategories = [],
  } = args;

  return {
    filterPropsForToolbar: {
      collapseListedFiltersBreakpoint: "xl",
      clearAllFilters: () => setFilterValues({}),
      clearFiltersButtonText: t("actions.clearAllFilters"),
    },
    propsForFilterToolbar: {
      filterCategories,
      filterValues,
      setFilterValues,
    },
  };
};
