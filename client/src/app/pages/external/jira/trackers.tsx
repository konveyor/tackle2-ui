import * as React from "react";
import {
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
  useDeleteTrackerMutation,
  useFetchTrackers,
} from "@app/queries/trackers";
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
import { Tracker, Ref } from "@app/api/models";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { useFetchTickets } from "@app/queries/tickets";
import TrackerStatus from "./components/tracker-status";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [instanceModalState, setInstanceModalState] = React.useState<
    "create" | Tracker | null
  >(null);
  const isInstanceModalOpen = instanceModalState !== null;
  const instanceToUpdate =
    instanceModalState !== "create" ? instanceModalState : null;

  const [instanceToDeleteState, setInstanceToDeleteState] =
    React.useState<Ref | null>(null);
  const isConfirmDialogOpen = instanceToDeleteState !== null;

  const { trackers, isFetching, fetchError, refetch } = useFetchTrackers();

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

  const { mutate: deleteInstance } = useDeleteTrackerMutation(
    onDeleteInstanceSuccess,
    onDeleteInstanceError
  );

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: trackers,
    columnNames: {
      name: "Instance name",
      url: "URL",
      kind: "Instance type",
      connection: "Connection",
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
    getSortValues: (tracker) => ({
      name: tracker.name || "",
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
          when={isFetching && !(trackers || fetchError)}
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
                    <Th {...getThProps({ columnKey: "connection" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={trackers.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((tracker, rowIndex) => (
                    <Tr key={tracker.name}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={tracker}
                        rowIndex={rowIndex}
                      >
                        <Td width={10} {...getTdProps({ columnKey: "name" })}>
                          {tracker.name}
                        </Td>
                        <Td width={20} {...getTdProps({ columnKey: "url" })}>
                          {tracker.url}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "kind" })}>
                          {tracker.kind}
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "kind" })}>
                          <TrackerStatus connected={tracker.connected} />
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            onEdit={() => setInstanceModalState(tracker)}
                            onDelete={() => {
                              includesTracker(tracker.id)
                                ? pushNotification({
                                    title: t(
                                      "This instance contains issues associated with applications and cannot be deleted"
                                    ),
                                    variant: "danger",
                                  })
                                : setInstanceToDeleteState({
                                    id: tracker.id,
                                    name: tracker.name,
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
        title={t("dialog.title.delete", {
          what: t("terms.instance").toLowerCase(),
        })}
        isOpen={isConfirmDialogOpen}
        titleIconVariant={"warning"}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setInstanceToDeleteState(null)}
        onClose={() => setInstanceToDeleteState(null)}
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
