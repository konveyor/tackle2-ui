import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";
import { useFetchTagTypes } from "@app/queries/tags";
import {
  FilterCategory,
  FilterType,
} from "@app/shared/components/FilterToolbar/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { dedupeFunction } from "@app/utils/utils";
import { useSelectionState } from "@migtools/lib-ui";
export enum ApplicationTableType {
  Assessment = "assessment",
  Analysis = "analysis",
  Addons = "addons",
}
export const useApplicationsFilterValues = (
  applications: Application[],
  tableType: string
) => {
  const { identities } = useFetchIdentities();

  const { t } = useTranslation();

  const { tagTypes } = useFetchTagTypes();

  const filterCategories: FilterCategory<Application>[] = [
    {
      key: "name",
      title: t("terms.name"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.name").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
    {
      key: "description",
      title: t("terms.description"),
      type: FilterType.search,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.description").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        return item.description || "";
      },
    },
    {
      key: "businessService",
      title: t("terms.businessService"),
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.businessService").toLowerCase(),
        }) + "...",
      type: FilterType.select,
      selectOptions: dedupeFunction(
        applications
          .filter((app) => !!app.businessService?.name)
          .map((app) => app.businessService?.name)
          .map((name) => ({ key: name, value: name }))
      ),
      getItemValue: (item) => {
        return item.businessService?.name || "";
      },
    },
    {
      key: "identities",
      title: t("terms.credentialType"),
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.credentialType").toLowerCase(),
        }) + "...",
      type: FilterType.multiselect,
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
      title: t("terms.repositoryType"),
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.repositoryType").toLowerCase(),
        }) + "...",
      type: FilterType.select,
      selectOptions: [
        { key: "git", value: "Git" },
        { key: "subversion", value: "Subversion" },
      ],
      getItemValue: (item) => {
        const kind = item?.repository?.kind || "";
        return kind;
      },
    },
    {
      key: "binary",
      title: t("terms.artifact"),
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.artifact").toLowerCase(),
        }) + "...",
      type: FilterType.select,
      selectOptions: [
        { key: "binary", value: t("terms.artifactAssociated") },
        { key: "none", value: t("terms.artifactNotAssociated") },
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
      title: t("terms.tags"),
      type: FilterType.multiselect,
      placeholderText:
        t("actions.filterBy", {
          what: t("terms.tagName").toLowerCase(),
        }) + "...",
      getItemValue: (item) => {
        let tagNames = item?.tags?.map((tag) => tag.name).join("");
        return tagNames || "";
      },
      selectOptions: dedupeFunction(
        tagTypes
          ?.map((tagType) => tagType?.tags)
          .flat()
          .filter((tag) => tag && tag.name)
          .map((tag) => ({ key: tag?.name, value: tag?.name }))
      ),
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    applications || [],
    filterCategories,
    "applicationsFilter"
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

  // Expand, select rows
  const {
    isItemSelected: isRowExpanded,
    toggleItemSelected: toggleRowExpanded,
    selectAll: expandAll,
    areAllSelected: areAllExpanded,
  } = useSelectionState<Application>({
    items: filteredItems || [],
    isEqual: (a, b) => a.id === b.id,
  });

  //Bulk selection
  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Application>({
    items: filteredItems || [],
    isEqual: (a, b) => a.id === b.id,
  });

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
    isRowSelected,
    toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedRows,
    isRowExpanded,
    toggleRowExpanded,
    expandAll,
    areAllExpanded,
    setPageNumber,
  };
};
