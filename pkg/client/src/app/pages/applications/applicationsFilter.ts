import { Application } from "@app/api/models";
import {
  FilterCategory,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
export enum ApplicationTableType {
  Assessment = "assessment",
  Analysis = "analysis",
}
export const getApplicationsFilterValues = (
  applications: Application[],
  tableType: string
) => {
  const filterCategories: FilterCategory<Application>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "description",
      title: "Description",
      type: FilterType.search,
      placeholderText: "Filter by description...",
      getItemValue: (item) => {
        return item.description || "";
      },
    },
    {
      key: "businessService",
      title: "Business service",
      type: FilterType.search,
      placeholderText: "Filter by business service...",
      getItemValue: (item) => {
        return item.businessService?.name || "";
      },
    },
  ];
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    applications || [],
    filterCategories
  );
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const getSortValues = (item: Application) => [
    item?.name || "",
    item?.description || "",
    item.businessService?.name || "",
    item.tags?.length || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );
  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);
  return {
    currentPageItems,
    paginationProps,
    sortBy,
    onSort,
    filterCategories,
    filterValues,
    setFilterValues,
    handleOnClearAllFilters,
  };
};
