import { type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";

import { ManageColumnsToolbar } from "../applications/applications-table/components/manage-columns-toolbar";

import { Permission } from "./types";
import { useFetchPermissions } from "./use-permissions";

export const PermissionsPage: FC = () => {
  const { t } = useTranslation();

  const { permissions } = useFetchPermissions();
  const tableControls = useLocalTableControls({
    tableName: "permissions-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: permissions,
    columnNames: {
      id: "ID",
      name: "Name",
      scope: "Scope",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: false,
    sortableColumns: ["id", "name", "scope"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (permission) => ({
      id: permission?.id?.toString() || "",
      name: permission?.name || "",
      scope: permission?.scope || "",
    }),
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", { what: "ID..." }),
        getItemValue: (permission) => permission?.id?.toString() || "",
      },
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (permission) => permission?.name || "",
      },
      {
        categoryKey: "scope",
        title: "Scope",
        type: FilterType.search,
        placeholderText: "Filter by scope...",
        getItemValue: (permission) => permission?.scope || "",
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
      getColumnVisibility,
    },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {};

  const toCells = ({ id, name, scope }: Permission) => ({
    id,
    name,
    scope,
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("titles.permissions")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} />
            <ManageColumnsToolbar
              columns={columnState.columns}
              setColumns={columnState.setColumns}
              defaultColumns={columnState.defaultColumns}
            />
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="permissions-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table
          {...tableProps}
          id="permissions-table"
          aria-label={t("titles.permissionTable")}
        >
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                {columnState.columns
                  .filter(({ id }) => getColumnVisibility(id))
                  .map(({ id }) => (
                    <Th
                      key={id}
                      {...getThProps({ columnKey: id })}
                      info={tooltips[id]}
                    />
                  ))}
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isNoData={permissions.length === 0}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noPermissionsFoundTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((permission): [Permission, { [p: string]: ReactNode }] => [
                  permission,
                  toCells(permission),
                ])
                .map(([permission, cells], rowIndex) => (
                  <Tr key={permission.id} {...getTrProps({ item: permission })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={permission}
                      rowIndex={rowIndex}
                    >
                      {columnState.columns
                        .filter(({ id }) => getColumnVisibility(id))
                        .map(({ id: columnKey }) => (
                          <Td
                            key={`${columnKey}_${permission.id}`}
                            {...getTdProps({ columnKey })}
                          >
                            {cells[columnKey]}
                          </Td>
                        ))}
                    </TableRowContentWithControls>
                  </Tr>
                ))}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="permissions-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </PageSection>
    </>
  );
};

export default PermissionsPage;
