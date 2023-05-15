import * as React from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import {
  AppPlaceholder,
  AppTableActionButtons,
  ConditionalRender,
  ConfirmDialog,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  useDeleteJiraTrackerMutation,
  useFetchJiraTrackers,
} from "@app/queries/jiratrackers";
import {
  Tbody,
  Tr,
  Td,
  Thead,
  Th,
  TableComposable,
} from "@patternfly/react-table";

import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { InstanceForm } from "./instance-form";
import { JiraTracker, Ref } from "@app/api/models";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { useFetchTickets } from "@app/queries/tickets";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [instanceModalState, setInstanceModalState] = React.useState<
    "create" | JiraTracker | null
  >(null);
  const isInstanceModalOpen = instanceModalState !== null;
  const instanceToUpdate =
    instanceModalState !== "create" ? instanceModalState : null;

  const [instanceToDeleteState, setInstanceToDeleteState] =
    React.useState<Ref | null>(null);
  const isConfirmDialogOpen = instanceToDeleteState !== null;

  const { jiraTrackers, isFetching, fetchError, refetch } =
    useFetchJiraTrackers();

  const [isAlertDelete, setIsAlertDelete] = React.useState(false);

  const { tickets } = useFetchTickets();

  const includesTracker = (id: number) =>
    tickets.map((ticket) => ticket.tracker.id).includes(id);

  const onDeleteInstanceSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deleted", {
        what: name,
        type: t("terms.instance"),
      }),
      variant: "success",
    });
  };

  const onDeleteInstanceError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    refetch();
  };

  const { mutate: deleteInstance } = useDeleteJiraTrackerMutation(
    onDeleteInstanceSuccess,
    onDeleteInstanceError
  );

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: jiraTrackers,
    columnNames: {
      name: "Instance name",
      url: "URL",
      kind: "Instance type",
    },
    isSelectable: true,
    filterCategories: [
      {
        key: "name",
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
    ],
    getSortValues: (jiraTracker) => ({
      name: jiraTracker.name || "",
      url: "", // TODO
    }),
    sortableColumns: ["name", "url"],
    hasPagination: true,
    isLoading: isFetching,
  });
  const {
    currentPageItems,
    numRenderedColumns,
    selectionState: { selectedItems },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.jiraConfig")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(jiraTrackers || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  {/* <RBAC
                    allowedPermissions={[]}
                    rbacType={RBAC_TYPE.Scope}
                  > */}
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-instance"
                      aria-label="Create new instance"
                      variant={ButtonVariant.primary}
                      onClick={() => setInstanceModalState("create")}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {/* {jiraDropdownItems.length ? (
                    <ToolbarItem>
                      <KebabDropdown
                        dropdownItems={migrationWaveDropdownItems}
                      ></KebabDropdown>
                    </ToolbarItem>
                  ) : (
                    <></>
                  )} */}
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="jira-instance-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <TableComposable {...tableProps} aria-label="Jira trackers table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "url" })} />
                    <Th {...getThProps({ columnKey: "kind" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={jiraTrackers.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((jiraTracker, rowIndex) => (
                    <Tr key={jiraTracker.name}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={jiraTracker}
                        rowIndex={rowIndex}
                      >
                        <Td width={10} {...getTdProps({ columnKey: "name" })}>
                          {jiraTracker.name}
                        </Td>
                        <Td width={20} {...getTdProps({ columnKey: "url" })}>
                          {jiraTracker.url}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "kind" })}>
                          {jiraTracker.kind}
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            onEdit={() => setInstanceModalState(jiraTracker)}
                            onDelete={() => {
                              includesTracker(jiraTracker.id)
                                ? setIsAlertDelete(true)
                                : setInstanceToDeleteState({
                                    id: jiraTracker.id,
                                    name: jiraTracker.name,
                                  });
                            }}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </TableComposable>
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        title={
          instanceToUpdate
            ? t("dialog.title.update", {
                what: t("terms.instance").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.instance").toLowerCase(),
              })
        }
        variant="medium"
        isOpen={isInstanceModalOpen}
        onClose={() => {
          setInstanceModalState(null);
        }}
      >
        <InstanceForm
          instance={instanceToUpdate ? instanceToUpdate : undefined}
          onClose={() => {
            setInstanceModalState(null);
          }}
        />
      </Modal>
      <ConfirmDialog
        title={
          isAlertDelete
            ? "Cannot delete instance"
            : t("dialog.title.delete", {
                what: t("terms.instance").toLowerCase(),
              })
        }
        isOpen={isConfirmDialogOpen || isAlertDelete}
        titleIconVariant={"warning"}
        message={
          isAlertDelete
            ? "This instance contains issues associated with applications and cannot be deleted"
            : t("dialog.message.delete")
        }
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={isAlertDelete ? "" : t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() =>
          isAlertDelete
            ? setIsAlertDelete(false)
            : setInstanceToDeleteState(null)
        }
        onClose={() =>
          isAlertDelete
            ? setIsAlertDelete(false)
            : setInstanceToDeleteState(null)
        }
        onConfirm={() => {
          if (instanceToDeleteState) {
            deleteInstance(
              instanceToDeleteState as { id: number; name: string }
            );
          }
          setInstanceToDeleteState(null);
        }}
      />
    </>
  );
};
