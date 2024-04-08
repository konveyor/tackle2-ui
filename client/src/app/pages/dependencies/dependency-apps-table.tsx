import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useSelectionState } from "@migtools/lib-ui";
import { AnalysisAppDependency, AnalysisDependency } from "@app/api/models";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
  deserializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ExternalLink } from "@app/components/ExternalLink";
import { SimplePagination } from "@app/components/SimplePagination";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useFetchAppDependencies } from "@app/queries/dependencies";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagsWithTagItems } from "@app/queries/tags";
import { getParsedLabel } from "@app/utils/rules-utils";
import { extractFirstSha } from "@app/utils/utils";
import { useHistory } from "react-router-dom";

export interface IDependencyAppsTableProps {
  dependency: AnalysisDependency;
}

export const DependencyAppsTable: React.FC<IDependencyAppsTableProps> = ({
  dependency,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const { businessServices } = useFetchBusinessServices();
  const { tagItems } = useFetchTagsWithTagItems();

  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");
  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const tableControlState = useTableControlState({
    tableName: "dependency-apps-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.dependencyApplications,
    columnNames: {
      name: "Application",
      version: "Version",
      management: "Management",
      relationship: "Relationship",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name", "version"],
    initialSort: { columnKey: "name", direction: "asc" },
    initialFilterValues: deserializedFilterValues,
    filterCategories: [
      {
        categoryKey: "application.name",
        title: "Application Name",
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "businessService",
        title: t("terms.businessService"),
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.businessService").toLowerCase(),
          }) + "...",
        type: FilterType.select,
        selectOptions: businessServices
          .map((businessService) => businessService.name)
          .map((name) => ({ key: name, value: name })),
      },
      {
        categoryKey: "tag.id",
        title: t("terms.tags"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.tagName").toLowerCase(),
          }) + "...",
        selectOptions: tagItems.map(({ name, tagName, categoryName }) => ({
          value: name,
          label: name,
          chipLabel: tagName,
          groupLabel: categoryName,
        })),
        /**
         * Convert the selected `selectOptions` to an array of tag ids the server side
         * filtering will understand.
         */
        getServerFilterValue: (selectedOptions) =>
          selectedOptions
            ?.map((option) => tagItems.find((item) => option === item.name))
            .filter(Boolean)
            .map(({ id }) => String(id)) ?? [],
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageAppDependencies, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchAppDependencies(
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        name: "name",
        version: "version",
      },
      implicitFilters: [
        { field: "dep.name", operator: "=", value: dependency.name },
        { field: "dep.provider", operator: "=", value: dependency.provider },
      ],
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "name",
    currentPageItems: currentPageAppDependencies,
    totalItemCount,
    isLoading: isFetching,
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageAppDependencies,
      isEqual: (a, b) => a.name === b.name,
    }),
  });

  const {
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
  };
  return (
    <>
      <Toolbar
        {...toolbarProps}
        className={spacing.mtSm}
        clearAllFilters={clearFilters}
      >
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="dependency-apps-table"
              isTop
              isCompact
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="Dependency applications table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "version" })} modifier="nowrap" />
              <Th
                {...getThProps({ columnKey: "management" })}
                modifier="nowrap"
              />
              <Th
                {...getThProps({ columnKey: "relationship" })}
                modifier="nowrap"
              />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isFetching}
          isError={!!fetchError}
          isNoData={totalItemCount === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageAppDependencies?.map((appDependency, rowIndex) => (
              <Tr
                key={appDependency.id}
                {...getTrProps({ item: appDependency })}
              >
                <TableRowContentWithControls
                  {...tableControls}
                  item={appDependency}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "name" })}>
                    {appDependency.name}
                  </Td>
                  <Td
                    width={10}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "version" })}
                  >
                    <DependencyVersionColumn appDependency={appDependency} />
                  </Td>
                  <Td
                    width={20}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "management" })}
                  >
                    <DependencyManagementColumn appDependency={appDependency} />
                  </Td>
                  <Td
                    width={20}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "relationship" })}
                  >
                    {appDependency.dependency.indirect
                      ? "Transitive"
                      : "Direct"}
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="dependency-apps-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};

const DependencyManagementColumn = ({
  appDependency,
}: {
  appDependency: AnalysisAppDependency;
}) => {
  const hasJavaLabel = appDependency.dependency?.labels?.some((label) => {
    const labelValue = getParsedLabel(label).labelValue;
    return labelValue === "java";
  });
  const isJavaFile = appDependency.dependency.name.endsWith(".jar");
  const isJavaDependency = hasJavaLabel && isJavaFile;

  return <TextContent>{isJavaDependency ? "Embedded" : "Managed"}</TextContent>;
};

const DependencyVersionColumn = ({
  appDependency: {
    dependency: { provider, name, version, sha },
  },
}: {
  appDependency: AnalysisAppDependency;
}) => {
  const isJavaDependency = name && version && sha && provider === "java";

  const mavenCentralLink = isJavaDependency
    ? `https://search.maven.org/search?q=1:${extractFirstSha(sha)}`
    : undefined;

  return (
    <TextContent>
      {mavenCentralLink ? (
        <ExternalLink isInline href={mavenCentralLink}>
          {version}
        </ExternalLink>
      ) : (
        <Text>{version}</Text>
      )}
    </TextContent>
  );
};
