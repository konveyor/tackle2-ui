import { Application, Identity } from "@app/api/models";
import {
  IdentitiesQueryKey,
  useFetchIdentities,
} from "@app/queries/identities";
import {
  FilterCategory,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useQueryClient } from "react-query";
export enum ApplicationTableType {
  Assessment = "assessment",
  Analysis = "analysis",
}
export const getApplicationsFilterValues = (
  applications: Application[],
  tableType: string
) => {
  const {
    identities,
    isFetching,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities();
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
    {
      key: "identities",
      title: "Credential type",
      placeholderText: "Filter by credential type...",
      type: FilterType.select,
      selectOptions: [
        { key: "source", value: "Source" },
        { key: "maven", value: "Maven" },
        { key: "proxy", value: "Proxy" },
      ],
      getItemValue: (item) => {
        const searchStringArr: string[] = [];
        item.identities?.forEach((appIdentity) => {
          const matchingIdentity = identities.find(
            (identity) => identity.id === appIdentity.id
          );
          searchStringArr.push(matchingIdentity?.kind || "");
        });
        const searchString = searchStringArr.join("");
        return searchString;
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
    "",
    "",
    item?.name || "",
    "",
    item.businessService?.name || "",
    "",
    ...(tableType === ApplicationTableType.Assessment ? [""] : []),
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
