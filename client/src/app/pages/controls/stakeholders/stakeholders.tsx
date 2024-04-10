import * as React from "react";
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
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { Stakeholder } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useDeleteStakeholderMutation,
  useFetchStakeholders,
} from "@app/queries/stakeholders";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { StakeholderForm } from "./components/stakeholder-form";

export const Stakeholders: React.FC = () => {
  const { t } = useTranslation();

  const [stakeholderToDelete, setStakeholderToDelete] =
    React.useState<Stakeholder>();

  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Stakeholder | null
  >(null);
  const isCreateUpdateModalOpen = createUpdateModalState !== null;
  const stakeholderToUpdate =
    createUpdateModalState !== "create" ? createUpdateModalState : null;

  const { pushNotification } = React.useContext(NotificationsContext);

  const onDeleteStakeholderSuccess = (response: any) => {
    pushNotification({
      title: t("terms.stakeholderDeleted"),
      variant: "success",
    });
  };

  const onDeleteStakeholderError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteStakeholder } = useDeleteStakeholderMutation(
    onDeleteStakeholderSuccess,
    onDeleteStakeholderError
  );

  const { stakeholders, isFetching, fetchError, refetch } =
    useFetchStakeholders();

  const closeCreateUpdateModal = () => {
    setCreateUpdateModalState(null);
    refetch;
  };

  const tableControls = useLocalTableControls({
    tableName: "stakeholders-table",
    idProperty: "email",
    items: stakeholders,
    columnNames: {
      email: "Email",
      name: "Name",
      jobFunction: "Job function",
      groupCount: "Group count",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    expandableVariant: "single",
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "email",
        title: t("terms.email"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.email").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.email || "";
        },
      },
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
        categoryKey: "jobFunction",
        title: t("terms.jobFunction"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.jobFunction").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item.jobFunction?.name || "";
        },
      },
      {
        categoryKey: "stakeholderGroups",
        title: t("terms.stakeholderGroups"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.stakeholderGroups").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          const stakeholderGroups = item.stakeholderGroups?.map(
            (stakeholderGroup) => stakeholderGroup.name
          );
          return stakeholderGroups?.join(" ; ") || "";
        },
      },
    ],
    sortableColumns: ["email", "name", "jobFunction"],
    getSortValues: (item) => ({
      email: item?.email || "",
      name: item?.name || "",
      jobFunction: item.jobFunction?.name || "",
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

  const deleteRow = (row: Stakeholder) => {
    setStakeholderToDelete(row);
  };

  return (
    <>
      <ConditionalRender
        when={isFetching && !(stakeholders || fetchError)}
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
                  <Button
                    type="button"
                    id="create-stakeholder"
                    aria-label="Create new stakeholder"
                    variant={ButtonVariant.primary}
                    onClick={() => setCreateUpdateModalState("create")}
                  >
                    {t("actions.createNew")}
                  </Button>
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
                  <Th {...getThProps({ columnKey: "email" })} />
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "jobFunction" })} />
                  <Th {...getThProps({ columnKey: "groupCount" })} />
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
                      what: t("terms.stakeholder").toLowerCase(),
                    })}
                  </Title>
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("terms.add"),
                      what: t("terms.stakeholder").toLowerCase(),
                    })}
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              {currentPageItems?.map((stakeholder, rowIndex) => {
                const hasGroups = stakeholder.stakeholderGroups?.length;
                return (
                  <Tbody
                    key={stakeholder.id}
                    isExpanded={isCellExpanded(stakeholder)}
                  >
                    <Tr {...getTrProps({ item: stakeholder })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={stakeholder}
                        rowIndex={rowIndex}
                      >
                        <Td width={25} {...getTdProps({ columnKey: "email" })}>
                          {stakeholder.email}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "name" })}>
                          {stakeholder.name}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "jobFunction" })}
                        >
                          {stakeholder.jobFunction?.name}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "groupCount" })}
                        >
                          {stakeholder.stakeholderGroups?.length}
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            onEdit={() =>
                              setCreateUpdateModalState(stakeholder)
                            }
                            onDelete={() => deleteRow(stakeholder)}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                    {isCellExpanded(stakeholder) ? (
                      <Tr isExpanded>
                        <Td />
                        <Td
                          {...getExpandedContentTdProps({ item: stakeholder })}
                          className={spacing.pyLg}
                        >
                          <ExpandableRowContent>
                            {hasGroups ? (
                              <DescriptionList>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>
                                    {t("terms.group(s)")}
                                  </DescriptionListTerm>
                                  {!!stakeholder.stakeholderGroups?.length && (
                                    <DescriptionListDescription>
                                      {stakeholder.stakeholderGroups
                                        ?.map((f) => f.name)
                                        .join(", ")}
                                    </DescriptionListDescription>
                                  )}
                                </DescriptionListGroup>
                              </DescriptionList>
                            ) : (
                              <EmptyState variant="sm">
                                <EmptyStateIcon icon={CubesIcon} />
                                <Title headingLevel="h2" size="lg">
                                  {t("composed.noDataStateTitle", {
                                    what: t(
                                      "terms.stakeholderGroups"
                                    ).toLowerCase(),
                                  })}
                                </Title>
                                <EmptyStateBody>
                                  {t("composed.noDataStateBody", {
                                    how: t("terms.add"),
                                    what: t(
                                      "terms.stakeholderGroup"
                                    ).toLowerCase(),
                                  })}
                                </EmptyStateBody>
                              </EmptyState>
                            )}
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    ) : null}
                  </Tbody>
                );
              })}
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="stakeholders-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </ConditionalRender>

      <Modal
        id="create-edit-stakeholder-modal"
        title={
          stakeholderToUpdate
            ? t("dialog.title.update", {
                what: t("terms.stakeholder").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.stakeholder").toLowerCase(),
              })
        }
        variant={ModalVariant.medium}
        isOpen={isCreateUpdateModalOpen}
        onClose={closeCreateUpdateModal}
      >
        <StakeholderForm
          stakeholder={stakeholderToUpdate ? stakeholderToUpdate : undefined}
          onClose={closeCreateUpdateModal}
        />
      </Modal>

      {!!stakeholderToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.stakeholder").toLowerCase(),
            name: stakeholderToDelete.name,
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setStakeholderToDelete(undefined)}
          onClose={() => setStakeholderToDelete(undefined)}
          onConfirm={() => {
            if (stakeholderToDelete) {
              deleteStakeholder(stakeholderToDelete.id);
              setStakeholderToDelete(undefined);
            }
          }}
        />
      )}
    </>
  );
};
