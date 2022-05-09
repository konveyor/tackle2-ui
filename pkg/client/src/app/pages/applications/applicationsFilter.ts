import { Application, Tag, TagType } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchTags, useFetchTagTypes } from "@app/queries/tags";
import {
  FilterCategory,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { dedupeFunction } from "@app/utils/utils";
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
  const { tags } = useFetchTags();
  const { tagTypes } = useFetchTagTypes();

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
    {
      key: "repository",
      title: "Repository type",
      placeholderText: "Filter by repository type...",
      type: FilterType.select,
      selectOptions: [
        { key: "git", value: "Git" },
        { key: "svn", value: "SVN" },
      ],
      getItemValue: (item) => {
        const url = item?.repository?.url || "";
        const fileExt = url.split(".").pop() || "";
        return fileExt;
      },
    },
    {
      key: "binary",
      title: "Artifact",
      placeholderText: "Filter by Artifact...",
      type: FilterType.select,
      selectOptions: [
        { key: "binary", value: "Associated artifact" },
        { key: "none", value: "No associated artifact" },
      ],
      getItemValue: (item) => {
        const hasBinary =
          item.binary !== "::" && item.binary?.match(/.+:.+:.+/)
            ? "binary"
            : "none";

        return hasBinary;
      },
    },
    {
      key: "tags",
      title: "Tags",
      type: FilterType.multiselect,
      placeholderText: "Filter by tag name...",
      getItemValue: (item) => {
        let tagNames = item?.tags?.map((tag) => tag.name).join("");
        return tagNames || "";
      },
      selectOptions: dedupeFunction(
        tagTypes
          ?.map((tagType) => tagType?.tags)
          .flat()
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
      ),
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
