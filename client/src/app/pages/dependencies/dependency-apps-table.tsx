import * as React from "react";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useSelectionState } from "@migtools/lib-ui";
import { AnalysisDependency } from "@app/api/models";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useFetchAppDependencies } from "@app/queries/dependencies";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTags } from "@app/queries/tags";

export interface IDependencyAppsTableProps {
  dependency: AnalysisDependency;
}

export const DependencyAppsTable: React.FC<IDependencyAppsTableProps> = ({
  dependency,
}) => {
  const { t } = useTranslation();
  const { businessServices } = useFetchBusinessServices();
  const { tags } = useFetchTags();

  const tableControlState = useTableControlState({
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.dependencyApplications,
    columnNames: {
      name: "Application",
      version: "Version",
      //   management (3rd party or not boolean... parsed from labels)
      relationship: "Relationship",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name", "version"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: [
      {
        key: "name",
        title: "Application Name",
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: "name", // TODO i18n
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        key: "businessService",
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
        key: "tag.id",
        title: t("terms.tags"),
        type: FilterType.multiselect,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.tagName").toLowerCase(),
          }) + "...",
        selectOptions: [...new Set(tags.map((tag) => tag.name))].map(
          (tagName) => ({ key: tagName, value: tagName })
        ),
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
        { field: "dep.version", operator: "=", value: dependency.version },
        { field: "dep.sha", operator: "=", value: dependency.sha },
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

  return (
    <>
      <Toolbar {...toolbarProps} className={spacing.mtSm}>
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
              {/* <Th
                {...getThProps({ columnKey: "management" })}
                modifier="nowrap"
              /> */}
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
                key={appDependency.name}
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
                    {appDependency.dependency.version}
                  </Td>
                  {/* <Td
                    width={20}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "management" })}
                  >
                    {appDependency.management}
                  </Td> */}
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
