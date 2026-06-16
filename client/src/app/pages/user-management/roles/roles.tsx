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
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { UserRole as Role } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchPermissions } from "@app/queries/permissions";
import { useFetchRoles } from "@app/queries/roles";

import { ManageColumnsToolbar } from "../../applications/applications-table/components/manage-columns-toolbar";
import { ScopeLabels, groupScopes } from "../components/scope-labels";

import { RoleCreateModal, RoleEditModal } from "./role-modal";
import { useRoleActionsWithNotifications } from "./use-roles";

/** Built-in / seeded roles cannot be edited or deleted. */
const isSeededRole = (role: Role) => role.id < 1000;

export const RolesPage: FC = () => {
  const { t } = useTranslation();

  const { roles, isLoading, fetchError } = useFetchRoles();
  const { deleteRole } = useRoleActionsWithNotifications();
  const [roleToEdit, setRoleToEdit] = useState<Role | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<Role | undefined>(undefined);
  const { permissions: allPermissions = [] } = useFetchPermissions();

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
    isExpansionEnabled: true,
    expandableVariant: "compound",
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
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {};

  const toCells = ({ id, name, permissions }: Role) => ({
    id,
    name,
    permissions: permissions.length,
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
            isLoading={isLoading}
            isError={!!fetchError}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noRolesFoundTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((role): [Role, ReturnType<typeof toCells>] => [
                  role,
                  toCells(role),
                ])
                .map(([role, cells], rowIndex) => (
                  <>
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
                              {...getTdProps({
                                columnKey,
                                isCompoundExpandToggle:
                                  columnKey === "permissions",
                                item: role,
                                rowIndex,
                              })}
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
                                isAriaDisabled: isSeededRole(role),
                                tooltipProps: isSeededRole(role)
                                  ? {
                                      content: t(
                                        "message.seededRoleCannotBeModified"
                                      ),
                                    }
                                  : undefined,
                              },
                              {
                                title: t("actions.duplicate"),
                                onClick: () => setCloneSource(role),
                              },
                              {
                                title: t("actions.delete"),
                                onClick: () => deleteRole(role),
                                isDanger: true,
                                isAriaDisabled: isSeededRole(role),
                                tooltipProps: isSeededRole(role)
                                  ? {
                                      content: t(
                                        "message.seededRoleCannotBeDeleted"
                                      ),
                                    }
                                  : undefined,
                              },
                            ]}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                    {isCellExpanded(role) ? (
                      <Tr isExpanded key={`${role.id}-expanded`}>
                        <Td />
                        <Td
                          colSpan={numRenderedColumns - 1}
                          {...getExpandedContentTdProps({ item: role })}
                        >
                          <ExpandableRowContent>
                            {groupScopes(
                              allPermissions
                                .filter(({ id }) =>
                                  role.permissions.some((p) => p.id === id)
                                )
                                .map((p) => p.scope)
                            ).map((group) => (
                              <ScopeLabels key={group.resource} group={group} />
                            ))}
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    ) : null}
                  </>
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
        isOpen={createOpen || !!cloneSource}
        cloneFrom={cloneSource}
        onClose={() => {
          setCreateOpen(false);
          setCloneSource(undefined);
        }}
      />
      <RoleEditModal
        role={roleToEdit}
        onClose={() => setRoleToEdit(undefined)}
      />
    </>
  );
};

export default RolesPage;
