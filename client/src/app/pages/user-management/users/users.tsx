import { type FC, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Content,
  Label,
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

import { ManageColumnsToolbar } from "../../applications/applications-table/components/manage-columns-toolbar";
import { User } from "../types";

import { isSeededUser } from "./use-user-form";
import { useFetchUsers, useUserActionsWithNotifications } from "./use-users";
import { UserCreateModal, UserEditModal } from "./user-modal";

export const UsersPage: FC = () => {
  const { t } = useTranslation();

  const { users, isLoading, fetchError } = useFetchUsers();
  const { deleteUser } = useUserActionsWithNotifications();
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);

  const tableControls = useLocalTableControls({
    tableName: "users-table",
    idProperty: "id",
    dataNameProperty: "login",
    items: users,
    columnNames: {
      id: "ID",
      login: "Login",
      name: "Name",
      email: "Email",
      roles: "Roles",
      tokens: "Tokens",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: true,
    sortableColumns: ["id", "login", "name", "email"],
    initialSort: { columnKey: "id", direction: "desc" },
    getSortValues: (user) => ({
      id: user?.id?.toString() || "",
      name: user?.name || "",
      email: user?.email || "",
      login: user?.login || "",
    }),
    filterCategories: [
      {
        categoryKey: "login",
        title: "Login",
        type: FilterType.search,
        placeholderText: "Filter by login...",
        getItemValue: (user) => user?.login || "",
      },
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (user) => user?.name || "",
      },
      {
        categoryKey: "email",
        title: "Email",
        type: FilterType.search,
        placeholderText: "Filter by email...",
        getItemValue: (user) => user?.email || "",
      },
      {
        categoryKey: "id",
        title: "ID",
        type: FilterType.numsearch,
        placeholderText: t("actions.filterBy", {
          what: "ID...",
        }),
        getItemValue: (user) => user?.id?.toString() || "",
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

  const tooltips: Record<string, ThProps["info"]> = {
    priority: { tooltip: t("tooltip.priority") },
  };

  const toCells = ({ id, login, name, email, roles, tokens }: User) => ({
    id,
    login,
    name: name || "-",
    email: email || "-",
    roles:
      roles?.map((role) => <Label key={role.id}>{role.name}</Label>) || "-",
    tokens: tokens.length || "-",
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("titles.users")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} />
            <ToolbarGroup variant="action-group">
              <ToolbarItem>
                <Button
                  type="button"
                  aria-label={t("titles.createUser")}
                  variant="primary"
                  onClick={() => setOpenCreateUserModal(true)}
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
                idPrefix="users-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table
          {...tableProps}
          id="users-table"
          aria-label={t("titles.userTable")}
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
            isNoData={users.length === 0}
            isLoading={isLoading}
            isError={!!fetchError}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noUsersFoundTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((user): [User, { [p: string]: ReactNode }] => [
                  user,
                  toCells(user),
                ])
                .map(([user, cells], rowIndex) => (
                  <Tr key={user.id} {...getTrProps({ item: user })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={user}
                      rowIndex={rowIndex}
                    >
                      {columnState.columns
                        .filter(({ id }) => getColumnVisibility(id))
                        .map(({ id: columnKey }) => (
                          <Td
                            key={`${columnKey}_${user.id}`}
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
                              onClick: () => setUserToEdit(user),
                            },
                            {
                              title: t("actions.delete"),
                              onClick: () => deleteUser(user),
                              isDanger: true,
                              isAriaDisabled: isSeededUser(user),
                              tooltipProps: isSeededUser(user)
                                ? {
                                    content: t(
                                      "message.seededUserCannotBeDeleted"
                                    ),
                                  }
                                : undefined,
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
          idPrefix="users-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </PageSection>
      <UserCreateModal
        isOpen={openCreateUserModal}
        onClose={() => setOpenCreateUserModal(false)}
      />
      <UserEditModal
        user={userToEdit}
        onClose={() => setUserToEdit(undefined)}
      />
    </>
  );
};

export default UsersPage;
