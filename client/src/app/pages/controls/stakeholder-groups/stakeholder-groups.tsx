import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  ModalVariant,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { getAxiosErrorMessage, numStr } from "@app/utils/utils";
import { StakeholderGroup } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { controlsWriteScopes, RBAC, RBAC_TYPE } from "@app/rbac";
import {
  useDeleteStakeholderGroupMutation,
  useFetchStakeholderGroups,
} from "@app/queries/stakeholdergroups";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { StakeholderGroupForm } from "./components/stakeholder-group-form";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import CubesIcon from "@patternfly/react-icons/dist/js/icons/cubes-icon";
import { ControlTableActionButtons } from "../ControlTableActionButtons";

export const StakeholderGroups: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [stakeholderGroupToDelete, setStakeholderGroupToDelete] =
    React.useState<StakeholderGroup>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | StakeholderGroup | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const stakeholderGroupToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const onDeleteStakeholderGroupSuccess = () => {
    pushNotification({
      title: t("terms.stakeholderGroupDeleted"),
      variant: "success",
    });
  };

  const onDeleteStakeholderGroupError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteStakeholderGroup } = useDeleteStakeholderGroupMutation(
    onDeleteStakeholderGroupSuccess,
    onDeleteStakeholderGroupError
  );

  const { stakeholderGroups, isFetching, fetchError, refetch } =
    useFetchStakeholderGroups();

  const deleteRow = (row: StakeholderGroup) => {
    setStakeholderGroupToDelete(row);
  };

  const closeCreateUpdateModal = () => {
    setCreateUpdateModalState(null);
    refetch();
  };

  const tableControls = useLocalTableControls({
    tableName: "stakeholder-groups-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: stakeholderGroups,
    columnNames: {
      name: "Name",
      description: "Description",
      count: "Member count",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    expandableVariant: "single",
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
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
        categoryKey: "description",
        title: t("terms.description"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.description").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.description || "";
        },
      },
      {
        categoryKey: "stakeholders",
        title: t("terms.stakeholders"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.stakeholders").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          const stakeholders = item.stakeholders?.map(
            (stakeholder) => stakeholder.name
          );
          return stakeholders?.join(" ; ") || "";
        },
      },
    ],
    sortableColumns: ["name", "description", "count"],
    getSortValues: (item) => ({
      name: item?.name || "",
      description: item?.description || "",
      count: numStr(item?.stakeholders?.length),
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    isLoading: isFetching,
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
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholderGroups || fetchError)}
        then={<AppPlaceholder />}
      >
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar {...toolbarProps}>
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <RBAC
                    allowedPermissions={controlsWriteScopes}
                    rbacType={RBAC_TYPE.Scope}
                  >
                    <Button
                      type="button"
                      id="create-stakeholder-group"
                      aria-label="Create stakeholder group"
                      variant={ButtonVariant.primary}
                      onClick={() => setCreateUpdateModalState("create")}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </RBAC>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="stakeholders-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table {...tableProps} aria-label="Stakeholders table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} width={25} />
                  <Th
                    {...getThProps({ columnKey: "description" })}
                    width={25}
                  />
                  <Th {...getThProps({ columnKey: "count" })} width={40} />
                  <Th width={10} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateIcon icon={CubesIcon} />
                  <Title headingLevel="h2" size="lg">
                    {t("composed.noDataStateTitle", {
                      what: t("terms.stakeholderGroup").toLowerCase(),
                    })}
                  </Title>
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("terms.add"),
                      what: t("terms.stakeholderGroup").toLowerCase(),
                    })}
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody key={stakeholderGroups?.length}>
                {currentPageItems?.map((stakeholderGroup, rowIndex) => {
                  return (
                    <>
                      <Tr {...getTrProps({ item: stakeholderGroup })}>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={stakeholderGroup}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {stakeholderGroup.name}
                          </Td>
                          <Td
                            width={25}
                            {...getTdProps({ columnKey: "description" })}
                          >
                            {stakeholderGroup.description}
                          </Td>
                          <Td
                            width={40}
                            {...getTdProps({ columnKey: "count" })}
                          >
                            {stakeholderGroup.stakeholders?.length}
                          </Td>
                          <ControlTableActionButtons
                            onEdit={() =>
                              setCreateUpdateModalState(stakeholderGroup)
                            }
                            onDelete={() => deleteRow(stakeholderGroup)}
                          />
                        </TableRowContentWithControls>
                      </Tr>
                      {isCellExpanded(stakeholderGroup) ? (
                        <Tr isExpanded>
                          <Td />
                          <Td
                            {...getExpandedContentTdProps({
                              item: stakeholderGroup,
                            })}
                            className={spacing.pyLg}
                          >
                            <ExpandableRowContent>
                              <DescriptionList>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    {t("terms.member(s)")}
                                  </DescriptionListTerm>
                                  {!!stakeholderGroup.stakeholders?.length && (
                                    <DescriptionListDescription>
                                      {stakeholderGroup.stakeholders
                                        ?.map((f) => f.name)
                                        .join(", ")}
                                    </DescriptionListDescription>
                                  )}
                                </DescriptionListGroup>
                              </DescriptionList>
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      ) : null}
                    </>
                  );
                })}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="stakeholder-groups-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </ConditionalRender>
      <Modal
        id="create-edit-stakeholder-group-modal"
        title={
          stakeholderGroupToUpdate
            ? t("dialog.title.update", {
                what: t("terms.stakeholderGroup").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.stakeholderGroup").toLowerCase(),
              })
        }
        variant={ModalVariant.medium}
        isOpen={isCreateUpdateModalOpen}
        onClose={closeCreateUpdateModal}
      >
        <StakeholderGroupForm
          stakeholderGroup={
            stakeholderGroupToUpdate ? stakeholderGroupToUpdate : undefined
          }
          onClose={closeCreateUpdateModal}
        />
      </Modal>

      {!!stakeholderGroupToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.stakeholderGroup").toLowerCase(),
            name: stakeholderGroupToDelete.name,
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setStakeholderGroupToDelete(undefined)}
          onClose={() => setStakeholderGroupToDelete(undefined)}
          onConfirm={() => {
            if (stakeholderGroupToDelete) {
              deleteStakeholderGroup(stakeholderGroupToDelete.id);
              setStakeholderGroupToDelete(undefined);
            }
          }}
        />
      )}
    </>
  );
};
