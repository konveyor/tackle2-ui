import * as React from "react";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Ref } from "@app/api/models";
import {
  useTableControlState,
  useTableControlProps,
  deserializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useHistory } from "react-router-dom";
import { useFetchApplications } from "@app/queries/applications";

export interface IPlatformAppsTableProps {
  platformApplications?: Ref[];
}

const PlatformAppsTable: React.FC<IPlatformAppsTableProps> = ({
  platformApplications,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");
  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const {
    data: baseApplications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
  } = useFetchApplications();

  const getPlatformApplication = () => {
    const platformApplicationIds = platformApplications?.map(
      (platformApplication) => platformApplication.id
    );
    return baseApplications?.filter((app) =>
      platformApplicationIds?.includes(app.id)
    );
  };

  const tableApplications = getPlatformApplication();

  const tableControlState = useTableControlState({
    tableName: "platform-apps-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.platformApplications,
    columnNames: {
      name: "Application",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name"],
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
    ],
    initialItemsPerPage: 10,
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: tableApplications,
    totalItemCount: tableApplications?.length ?? 0,
    isLoading: isFetchingApplications,
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
              idPrefix="platform-apps-table"
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
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isFetchingApplications}
          isError={!!applicationsFetchError}
          isNoData={tableApplications?.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {tableApplications?.map((app, rowIndex) => (
              <Tr key={app.id} {...getTrProps({ item: app })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={app}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "name" })}>
                    {app.name}
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

export default PlatformAppsTable;
