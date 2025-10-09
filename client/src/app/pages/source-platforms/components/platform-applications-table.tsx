import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Ref } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchApplications } from "@app/queries/applications";

export interface IPlatformAppsTableProps {
  platformApplications?: Ref[];
}

const PlatformAppsTable: React.FC<IPlatformAppsTableProps> = ({
  platformApplications: platformApplicationRefs,
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const {
    data: allApplications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
  } = useFetchApplications();

  const platformApplications = React.useMemo(() => {
    const idsToInclude = new Set(platformApplicationRefs?.map(({ id }) => id));
    return allApplications.filter(({ id }) => idsToInclude.has(id));
  }, [allApplications, platformApplicationRefs]);

  const tableControls = useLocalTableControls({
    tableName: "platform-apps-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: platformApplications,
    columnNames: {
      name: t("terms.name"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (app) => ({ name: app.name }),
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: ({ name }) => name ?? "",
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    currentPageItems,
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
      <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
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
      <Table {...tableProps} aria-label="source platform applications table">
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
          isNoData={currentPageItems.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((app, rowIndex) => (
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
