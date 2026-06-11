import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ActionsColumn,
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

import { RoleCreateModal, RoleEditModal } from "./roles/role-modal";
import {
  useFetchRoles,
  useRoleActionsWithNotifications,
} from "./roles/use-roles";
import { Role } from "./types";

export const RolesPage: FC = () => {
  const { t } = useTranslation();

  const { roles } = useFetchRoles();
  const { deleteRole } = useRoleActionsWithNotifications();
  const [roleToEdit, setRoleToEdit] = useState<Role | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const tableControls = useLocalTableControls({
    tableName: "roles-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: roles,
    columnNames: {
      id: "ID",
      name: "Name",
      permissions: "Permissions",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: true,
    sortableColumns: ["id", "name"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (role) => ({
      id: role?.id?.toString() || "",
      name: role?.name || "",
    }),
    filterCategories: [
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", { what: "ID..." }),
        getItemValue: (role) => role?.id?.toString() || "",
      },
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (role) => role?.name || "",
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

  const toCells = ({ id, name, permissions }: Role) => ({
    id,
    name,
    permissions: permissions.length || "-",
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("titles.roles")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} />
            <ToolbarGroup variant="action-group">
              <ToolbarItem>
                <Button
                  variant="primary"
                  aria-label={t("titles.createRole")}
                  onClick={() => setCreateOpen(true)}
                >
                  {t("actions.create")}
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
            <ManageColumnsToolbar
              columns={columnState.columns}
              setColumns={columnState.setColumns}
              defaultColumns={columnState.defaultColumns}
            />
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="roles-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table
          {...tableProps}
          id="roles-table"
          aria-label={t("titles.roleTable")}
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
                <Th screenReaderText={t("actions.rowActions")} />
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isNoData={roles.length === 0}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noRolesFoundTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((role): [Role, { [p: string]: ReactNode }] => [
                  role,
                  toCells(role),
                ])
                .map(([role, cells], rowIndex) => (
                  <Tr key={role.id} {...getTrProps({ item: role })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={role}
                      rowIndex={rowIndex}
                    >
                      {columnState.columns
                        .filter(({ id }) => getColumnVisibility(id))
                        .map(({ id: columnKey }) => (
                          <Td
                            key={`${columnKey}_${role.id}`}
                            {...getTdProps({ columnKey })}
                          >
                            {cells[columnKey]}
                          </Td>
                        ))}
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => setRoleToEdit(role),
                            },
                            {
                              title: t("actions.delete"),
                              onClick: () => deleteRole(role),
                              isDanger: true,
                            },
                          ]}
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="roles-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </PageSection>

      <RoleCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <RoleEditModal
        role={roleToEdit}
        onClose={() => setRoleToEdit(undefined)}
      />
    </>
  );
};

export default RolesPage;
