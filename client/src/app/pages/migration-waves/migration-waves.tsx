import * as React from "react";
import {
  Button,
  ButtonVariant,
  DropdownItem,
  Modal,
  ModalVariant,
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  useDeleteMigrationWaveMutation,
  useFetchMigrationWaves,
} from "@app/queries/migration-waves";
import {
  AppPlaceholder,
  ConditionalRender,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  AggregateTicketStatus,
  Application,
  MigrationWave,
  Ticket,
  TicketStatus,
} from "@app/api/models";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  ExpandableRowContent,
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { WaveApplicationsTable } from "./migration-wave-applications-table/migration-wave-applications-table";
import { WaveStakeholdersTable } from "./migration-wave-stakeholders-table/migration-wave-stakeholders-table";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { ExportForm } from "./components/export-form";
import { ManageApplicationsForm } from "./manage-applications-form";

import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";
import { WaveForm } from "./migration-wave-form";
import { WaveStatusTable } from "./migration-wave-status-table/migration-wave-status-table";
import { useFetchJiraTrackers } from "@app/queries/jiratrackers";
import { useFetchTickets } from "@app/queries/tickets";
dayjs.extend(utc);

export const MigrationWaves: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { migrationWaves, isFetching, fetchError, refetch } =
    useFetchMigrationWaves();

  const { jiraTrackers: instances } = useFetchJiraTrackers();

  const onDeleteWaveSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deleted", {
        what: name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onDeleteWaveError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    refetch();
  };

  const { mutate: deleteWave } = useDeleteMigrationWaveMutation(
    onDeleteWaveSuccess,
    onDeleteWaveError
  );

  const [migrationWaveModalState, setWaveModalState] = React.useState<
    "create" | MigrationWave | null
  >(null);
  const isWaveModalOpen = migrationWaveModalState !== null;
  const migrationWaveToEdit =
    migrationWaveModalState !== "create" ? migrationWaveModalState : null;
  const openCreateWaveModal = () => setWaveModalState("create");

  const [exportIssueModalOpen, setExportIssueModalOpen] = React.useState(false);

  const [applicationsToExport, setApplicationsToExport] = React.useState<
    Application[]
  >([]);

  const [waveToManageModalState, setWaveToManageModalState] =
    React.useState<MigrationWave | null>(null);

  const closeWaveModal = () => setWaveModalState(null);

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: migrationWaves,
    columnNames: {
      name: "Name",
      startDate: "Start date",
      endDate: "End date",
      applications: "Applications",
      stakeholders: "Stakeholders",
      status: "Status",
    },
    isSelectable: true,
    expandableVariant: "compound",
    hasActionsColumn: true,
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
    sortableColumns: ["name", "startDate", "endDate"],
    getSortValues: (migrationWave) => ({
      name: migrationWave.name || "",
      startDate: migrationWave.startDate || "",
      endDate: migrationWave.endDate || "",
    }),
    initialSort: { columnKey: "startDate", direction: "asc" },
    hasPagination: true,
    isLoading: isFetching,
  });
  const {
    currentPageItems,
    numRenderedColumns,
    expansionState: { isCellExpanded },
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
      getExpandedContentTdProps,
      getCompoundExpandTdProps,
    },
  } = tableControls;

  const { tickets } = useFetchTickets();

  const ticketStatusToAggreaate: Map<TicketStatus, AggregateTicketStatus> =
    new Map([
      ["", "Creating Issues"],
      ["New", "Issues Created"],
      ["In Progress", "In Progress"],
      ["Done", "Completed"],
      ["Error", "Error"],
    ]);

  const getTicketByApplication = (id: number = 0) =>
    tickets.find((ticket) => ticket.application.id === id);

  const getTicketStatus = (wave: MigrationWave) => {
    let tickets: string[] = [];
    wave.applications.forEach((application) => {
      const ticket = getTicketByApplication(application.id);
      if (ticket?.id) tickets.push(ticket.status || "");
    });
    return tickets as TicketStatus[];
  };

  const aggregateTicketStatus = (val: TicketStatus) => {
    const status = ticketStatusToAggreaate.get(val);
    return status ? status : "Error";
  };

  const aggregatedTicketStatus = (
    wave: MigrationWave
  ): AggregateTicketStatus => {
    const statuses = getTicketStatus(wave);
    if (statuses.length === 0) return "Error";

    const status = statuses.reduce(
      (acc, val) => (acc === val ? acc : "Error"),
      statuses[0]
    );

    return aggregateTicketStatus(status);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.migrationWaves")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(migrationWaves || fetchError)}
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
                      id="create-migration-wave"
                      aria-label="Create new migration-wave"
                      variant={ButtonVariant.primary}
                      onClick={openCreateWaveModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {
                    //RBAC
                    // xxxxWriteAccess = checkAccess(userScopes, migrationWaveWriteScopes);
                    true ? ( //TODO: Check RBAC access
                      <ToolbarItem>
                        <KebabDropdown
                          dropdownItems={[
                            <DropdownItem
                              key="bulk-export-to-issue-manager"
                              component="button"
                              onClick={() => {
                                setApplicationsToExport(
                                  selectedItems
                                    .map((item) => item.applications)
                                    .flat()
                                );
                                setExportIssueModalOpen(true);
                              }}
                            >
                              {t("actions.export")}
                            </DropdownItem>,
                            <DropdownItem
                              key="bulk-delete"
                              onClick={() => {
                                selectedItems.map((migrationWave) => {
                                  if (migrationWave.id)
                                    deleteWave({
                                      id: migrationWave.id,
                                      name: migrationWave.name,
                                    });
                                });
                              }}
                            >
                              {t("actions.delete")}
                            </DropdownItem>,
                          ]}
                        />
                      </ToolbarItem>
                    ) : null
                  }
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="migration-migration-waves-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <TableComposable {...tableProps} aria-label="Migration waves table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "startDate" })} />
                    <Th {...getThProps({ columnKey: "endDate" })} />
                    <Th {...getThProps({ columnKey: "applications" })} />
                    <Th {...getThProps({ columnKey: "stakeholders" })} />
                    <Th {...getThProps({ columnKey: "status" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={migrationWaves.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((migrationWave, rowIndex) => {
                  return (
                    <Tbody
                      key={migrationWave.id}
                      isExpanded={isCellExpanded(migrationWave)}
                    >
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={migrationWave}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {migrationWave.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "startDate" })}
                          >
                            {dayjs
                              .utc(migrationWave.startDate)
                              .format("MM/DD/YYYY")}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "endDate" })}
                          >
                            {dayjs
                              .utc(migrationWave.endDate)
                              .format("MM/DD/YYYY")}
                          </Td>
                          <Td
                            width={10}
                            {...getCompoundExpandTdProps({
                              item: migrationWave,
                              rowIndex,
                              columnKey: "applications",
                            })}
                          >
                            {migrationWave?.applications?.length.toString()}
                          </Td>
                          <Td
                            width={10}
                            {...getCompoundExpandTdProps({
                              item: migrationWave,
                              rowIndex,
                              columnKey: "stakeholders",
                            })}
                          >
                            {migrationWave?.stakeholders?.length.toString()}
                          </Td>
                          <Td
                            width={20}
                            {...getCompoundExpandTdProps({
                              item: migrationWave,
                              rowIndex,
                              columnKey: "status",
                            })}
                          >
                            {aggregatedTicketStatus(migrationWave)}
                          </Td>
                          <Td width={10}>
                            <KebabDropdown
                              dropdownItems={
                                //RBAC
                                // xxxxWriteAccess = checkAccess(userScopes, migration-waveWriteScopes);
                                true //TODO: Check RBAC access
                                  ? [
                                      <DropdownItem
                                        key="edit"
                                        component="button"
                                        onClick={() => {
                                          console.log(
                                            getTicketStatus(migrationWave)
                                          );
                                          setWaveModalState(migrationWave);
                                        }}
                                      >
                                        {t("actions.edit")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="manage-app"
                                        onClick={() => {
                                          setWaveToManageModalState(
                                            migrationWave
                                          );
                                        }}
                                      >
                                        {t("composed.manage", {
                                          what: t(
                                            "terms.applications"
                                          ).toLowerCase(),
                                        })}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="bulk-export-to-issue-manager"
                                        component="button"
                                        onClick={() => {
                                          setApplicationsToExport(
                                            migrationWave.applications
                                          );
                                          setExportIssueModalOpen(true);
                                        }}
                                      >
                                        {t("actions.export")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="delete"
                                        onClick={() => {
                                          if (migrationWave.id)
                                            deleteWave({
                                              id: migrationWave.id,
                                              name: migrationWave.name,
                                            });
                                        }}
                                      >
                                        {t("actions.delete")}
                                      </DropdownItem>,
                                    ]
                                  : []
                              }
                            />
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                      {isCellExpanded(migrationWave) ? (
                        <Tr isExpanded>
                          <Td
                            {...getExpandedContentTdProps({
                              item: migrationWave,
                            })}
                          >
                            <ExpandableRowContent>
                              {isCellExpanded(migrationWave, "applications") ? (
                                <WaveApplicationsTable
                                  migrationWave={migrationWave}
                                  applications={migrationWave.applications}
                                />
                              ) : isCellExpanded(
                                  migrationWave,
                                  "stakeholders"
                                ) ? (
                                <WaveStakeholdersTable
                                  migrationWave={migrationWave}
                                  stakeholders={migrationWave.stakeholders}
                                />
                              ) : isCellExpanded(migrationWave, "status") &&
                                instances.length > 0 ? (
                                <WaveStatusTable
                                  migrationWave={migrationWave}
                                  applications={migrationWave.applications}
                                />
                              ) : null}
                            </ExpandableRowContent>
                          </Td>
                        </Tr>
                      ) : null}
                    </Tbody>
                  );
                })}
              </ConditionalTableBody>
            </TableComposable>
            <SimplePagination
              idPrefix="migration-migration-waves-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        id="create-edit-migration-wave-modal"
        title={
          migrationWaveToEdit
            ? t("dialog.title.update", {
                what: t("terms.migrationWave").toLowerCase(),
              })
            : t("dialog.title.new", {
                what: t("terms.migrationWave").toLowerCase(),
              })
        }
        variant={ModalVariant.small}
        isOpen={isWaveModalOpen}
        onClose={closeWaveModal}
      >
        <WaveForm
          migrationWave={migrationWaveToEdit ? migrationWaveToEdit : undefined}
          onClose={closeWaveModal}
        />
      </Modal>
      <Modal
        title={t("terms.exportToIssue")}
        variant="medium"
        isOpen={exportIssueModalOpen}
        onClose={() => {
          setExportIssueModalOpen(false);
        }}
      >
        <ExportForm
          applications={applicationsToExport}
          onClose={() => {
            setExportIssueModalOpen(false);
          }}
        />
      </Modal>
      <Modal
        title={t("composed.manage", {
          what: t("terms.applications").toLowerCase(),
        })}
        width="50%"
        isOpen={!!waveToManageModalState}
        onClose={() => setWaveToManageModalState(null)}
      >
        {waveToManageModalState && (
          <ManageApplicationsForm
            migrationWave={waveToManageModalState}
            migrationWaves={migrationWaves}
            onClose={() => setWaveToManageModalState(null)}
          />
        )}
      </Modal>
    </>
  );
};
