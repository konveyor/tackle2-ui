import * as React from "react";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Modal,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import {
  useDeleteTrackerMutation,
  useFetchTrackers,
} from "@app/queries/trackers";
import { Tbody, Tr, Td, Thead, Th, Table } from "@patternfly/react-table";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";

import { useLocalTableControls } from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { TrackerForm } from "./tracker-form";
import { Tracker } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { useFetchTickets } from "@app/queries/tickets";
import TrackerStatus from "./components/tracker-status";
import { IssueManagerOptions, toOptionLike } from "@app/utils/model-utils";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { AppTableActionButtons } from "@app/components/AppTableActionButtons";
import useUpdatingTrackerIds from "./useUpdatingTrackerIds";

export const JiraTrackers: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [trackerModalState, setTrackerModalState] = React.useState<
    "create" | Tracker | null
  >(null);
  const isTrackerModalOpen = trackerModalState !== null;
  const trackerToUpdate =
    trackerModalState !== "create" ? trackerModalState : null;

  const [trackerToDelete, setTrackerToDelete] = React.useState<Tracker | null>(
    null
  );

  const { trackers, isFetching, fetchError, refetch } = useFetchTrackers();

  const { tickets } = useFetchTickets();

  const includesTracker = (id: number) =>
    tickets.map((ticket) => ticket.tracker.id).includes(id);

  const onDeleteTrackerSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: name,
        type: t("terms.instance"),
      }),
      variant: "success",
    });
  };

  const onDeleteTrackerError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    refetch();
  };

  const { mutate: deleteTracker } = useDeleteTrackerMutation(
    onDeleteTrackerSuccess,
    onDeleteTrackerError
  );

  const tableControls = useLocalTableControls({
    tableName: "jira-Tracker-table",
    idProperty: "name",
    items: trackers,
    columnNames: {
      name: `${t("terms.instance")} name`,
      url: "URL",
      kind: `${t("terms.instance")} type`,
      connection: "Connection",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
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
        categoryKey: "url",
        title: t("terms.url"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.url").toLowerCase(),
          }) + "...",
        getItemValue: (item) => {
          return item?.url || "";
        },
      },
    ],
    getSortValues: (tracker) => ({
      name: tracker.name || "",
      url: tracker.url || "",
    }),
    sortableColumns: ["name", "url"],
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
    },
  } = tableControls;

  const [updatingTrackerIds, addUpdatingTrackerId] = useUpdatingTrackerIds();

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
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="button-group">
                  {/* <RBAC
                    allowedPermissions={[]}
                    rbacType={RBAC_TYPE.Scope}
                  > */}
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-Tracker"
                      aria-label="Create new tracker"
                      variant={ButtonVariant.primary}
                      onClick={() => setTrackerModalState("create")}
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
                    idPrefix="jira-Tracker-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <Table {...tableProps} aria-label="Jira trackers table">
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
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateIcon icon={CubesIcon} />
                    <Title headingLevel="h2" size="lg">
                      {t("composed.noDataStateTitle", {
                        what: t("terms.jiraConfig").toLowerCase(),
                      })}
                    </Title>
                    <EmptyStateBody>
                      {t("composed.noDataStateBody", {
                        how: t("actions.create"),
                        what: t("terms.jiraConfig").toLowerCase(),
                      })}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((tracker, rowIndex) => (
                  <Tbody key={tracker.name}>
                    <Tr {...getTrProps({ item: tracker })}>
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
                          {toOptionLike(
                            tracker.kind,
                            IssueManagerOptions
                          )?.toString()}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "connection" })}
                        >
                          <TrackerStatus
                            name={tracker.name}
                            connected={tracker.connected}
                            message={tracker.message}
                            isTrackerUpdating={updatingTrackerIds.has(
                              tracker.id
                            )}
                          />
                        </Td>
                        <Td width={20}>
                          <AppTableActionButtons
                            onEdit={() => setTrackerModalState(tracker)}
                            onDelete={() => {
                              includesTracker(tracker.id)
                                ? pushNotification({
                                    title: t(
                                      "This instance contains issues associated with applications and cannot be deleted"
                                    ),
                                    variant: "danger",
                                  })
                                : setTrackerToDelete(tracker);
                            }}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  </Tbody>
                ))}
              </ConditionalTableBody>
            </Table>
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        title={
          trackerToUpdate
            ? t("dialog.title.update", {
                what: t("terms.instance").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.instance").toLowerCase(),
              })
        }
        variant="medium"
        isOpen={isTrackerModalOpen}
        onClose={() => {
          setTrackerModalState(null);
        }}
      >
        <TrackerForm
          tracker={trackerToUpdate ? trackerToUpdate : undefined}
          addUpdatingTrackerId={addUpdatingTrackerId}
          onClose={() => setTrackerModalState(null)}
        />
      </Modal>
      {!!trackerToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: t("terms.instance").toLowerCase(),
            name: trackerToDelete?.name,
          })}
          isOpen={true}
          titleIconVariant={"warning"}
          message={t("dialog.message.delete")}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setTrackerToDelete(null)}
          onClose={() => setTrackerToDelete(null)}
          onConfirm={() => {
            if (trackerToDelete) {
              deleteTracker({ tracker: trackerToDelete });
            }
            setTrackerToDelete(null);
          }}
        />
      )}
    </>
  );
};
