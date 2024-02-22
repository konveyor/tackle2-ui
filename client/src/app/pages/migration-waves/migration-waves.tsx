import * as React from "react";
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalVariant,
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
import {
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosResponse } from "axios";
import dayjs from "dayjs";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

import {
  useDeleteAllMigrationWavesMutation,
  useDeleteMigrationWaveMutation,
  useFetchMigrationWaves,
  useUpdateMigrationWaveMutation,
} from "@app/queries/migration-waves";
import { MigrationWave, Ref, Ticket } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ExportForm } from "./components/export-form";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useFetchTrackers } from "@app/queries/trackers";
import { useFetchApplications } from "@app/queries/applications";
import { WaveStakeholdersTable } from "./components/stakeholders-table";
import { WaveApplicationsTable } from "./components/wave-applications-table";
import { WaveStatusTable } from "./components/wave-status-table";
import { WaveForm } from "./components/migration-wave-form";
import { ManageApplicationsForm } from "./components/manage-applications-form";
import { deleteMigrationWave } from "@app/api/rest";
import { ConditionalTooltip } from "@app/components/ConditionalTooltip";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { toRefs } from "@app/utils/model-utils";
import { useFetchTickets } from "@app/queries/tickets";

export const MigrationWaves: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const currentTimezone = dayjs.tz.guess();

  const { migrationWaves, isFetching, fetchError } = useFetchMigrationWaves();
  const { tickets } = useFetchTickets();
  const { trackers: trackers } = useFetchTrackers();
  const { data: applications } = useFetchApplications();

  const [isToolbarKebabOpen, setIsToolbarKebabOpen] =
    React.useState<boolean>(false);
  const [isRowDropdownOpen, setIsRowDropdownOpen] = React.useState<
    number | null
  >(null);

  const [migrationWaveModalState, setWaveModalState] = React.useState<
    "create" | MigrationWave | null
  >(null);
  const isWaveModalOpen = migrationWaveModalState !== null;
  const migrationWaveToEdit =
    migrationWaveModalState !== "create" ? migrationWaveModalState : null;
  const openCreateWaveModal = () => setWaveModalState("create");

  const [applicationsToExport, setApplicationsToExport] = React.useState<
    Ref[] | null
  >(null);

  const [waveToManageModalState, setWaveToManageModalState] =
    React.useState<MigrationWave | null>(null);
  const closeWaveModal = () => setWaveModalState(null);

  const [migrationWaveToDelete, setMigrationWaveToDelete] = React.useState<{
    id: number;
    name: string;
  } | null>(null);

  const [migrationWavesToDelete, setMigrationWavesToDelete] = React.useState<
    number[] | null
  >(null);

  const onDeleteWaveSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: name,
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });
  };

  const onError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteWave } = useDeleteMigrationWaveMutation(
    onDeleteWaveSuccess,
    onError
  );

  const onDeleteAllMigrationWavesSuccess = () => {
    pushNotification({
      title: t("toastr.success.deletedAll", {
        type: t("terms.migrationWave(s)"),
      }),
      variant: "success",
    });
  };

  const { mutate: deleteAllMigrationWaves } =
    useDeleteAllMigrationWavesMutation(
      onDeleteAllMigrationWavesSuccess,
      onError
    );

  const onUpdateMigrationWaveSuccess = (_: AxiosResponse<MigrationWave>) =>
    pushNotification({
      title: t("toastr.success.save", {
        type: t("terms.migrationWave"),
      }),
      variant: "success",
    });

  const { mutate: updateMigrationWave } = useUpdateMigrationWaveMutation(
    onUpdateMigrationWaveSuccess,
    onError
  );

  const removeApplication = (migrationWave: MigrationWave, id: number) => {
    const applicationRefs = toRefs(
      migrationWave.applications.filter((application) => application.id !== id)
    );
    const payload: MigrationWave = {
      id: migrationWave.id,
      name: migrationWave.name,
      startDate: migrationWave.startDate,
      endDate: migrationWave.endDate,
      stakeholderGroups: migrationWave.stakeholderGroups,
      stakeholders: migrationWave.stakeholders,
      applications: applicationRefs || [],
    };

    updateMigrationWave(payload);
  };

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: migrationWaves,
    columnNames: {
      name: "Name",
      startDate: "Start date",
      endDate: "End date",
      applications: "Applications",
      stakeholders: "Stakeholders",
      status: "Status",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isExpansionEnabled: true,
    isSelectionEnabled: true,
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
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded, setCellExpanded },
  } = tableControls;

  // TODO: Check RBAC access
  const rbacWriteAccess = true; // checkAccess(userScopes, migrationWaveWriteScopes);

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
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
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
                  {rbacWriteAccess ? (
                    <ToolbarItem id="toolbar-kebab">
                      <Dropdown
                        isOpen={isToolbarKebabOpen}
                        onSelect={() => setIsToolbarKebabOpen(false)}
                        onOpenChange={(_isOpen) => setIsToolbarKebabOpen(false)}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle
                            ref={toggleRef}
                            aria-label="kebab dropdown toggle"
                            variant="plain"
                            onClick={() =>
                              setIsToolbarKebabOpen(!isToolbarKebabOpen)
                            }
                            isExpanded={isToolbarKebabOpen}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                        shouldFocusToggleOnSelect
                      >
                        <DropdownItem
                          isDisabled={
                            selectedItems.filter(
                              (migrationWave) =>
                                !!migrationWave.applications.length
                            ).length < 1
                          }
                          key="bulk-export-to-issue-manager"
                          component="button"
                          onClick={() =>
                            setApplicationsToExport(
                              selectedItems.flatMap((item) => item.applications)
                            )
                          }
                        >
                          {t("terms.exportToIssue")}
                        </DropdownItem>
                        <DropdownItem
                          key="bulk-delete"
                          isDisabled={selectedItems.length === 0}
                          onClick={() =>
                            setMigrationWavesToDelete(
                              selectedItems.map(
                                (migrationWave) => migrationWave.id
                              )
                            )
                          }
                        >
                          {t("actions.delete")}
                        </DropdownItem>
                      </Dropdown>
                    </ToolbarItem>
                  ) : null}
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
            <Table {...tableProps} aria-label="Migration waves table">
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
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateIcon icon={CubesIcon} />
                    <Title headingLevel="h2" size="lg">
                      No migration waves available
                    </Title>
                    <EmptyStateBody>
                      Use the filter menu above to select your migration wave.
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((migrationWave, rowIndex) => (
                  <Tbody
                    key={migrationWave.id}
                    isExpanded={isCellExpanded(migrationWave)}
                  >
                    <Tr {...getTrProps({ item: migrationWave })}>
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
                          {dayjs(migrationWave.startDate)
                            .tz(currentTimezone)
                            .format("MM/DD/YYYY")}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({ columnKey: "endDate" })}
                        >
                          {dayjs(migrationWave.endDate)
                            .tz(currentTimezone)
                            .format("MM/DD/YYYY")}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({
                            columnKey: "applications",
                            isCompoundExpandToggle: true,
                            item: migrationWave,
                            rowIndex,
                          })}
                        >
                          {migrationWave?.applications?.length.toString()}
                        </Td>
                        <Td
                          width={10}
                          {...getTdProps({
                            columnKey: "stakeholders",
                            isCompoundExpandToggle: true,
                            item: migrationWave,
                            rowIndex,
                          })}
                        >
                          {migrationWave.allStakeholders.length}
                        </Td>
                        <Td
                          width={20}
                          {...getTdProps({
                            columnKey: "status",
                            isCompoundExpandToggle:
                              !!migrationWave.applications.length ||
                              migrationWave.status === "No Issues",
                            item: migrationWave,
                            rowIndex,
                          })}
                        >
                          {migrationWave.applications.length
                            ? migrationWave.status
                            : "--"}
                        </Td>
                        <Td isActionCell id="row-actions">
                          <Dropdown
                            isOpen={isRowDropdownOpen === migrationWave.id}
                            onSelect={() => setIsRowDropdownOpen(null)}
                            onOpenChange={(_isOpen) =>
                              setIsRowDropdownOpen(null)
                            }
                            popperProps={{ position: "right" }}
                            toggle={(
                              toggleRef: React.Ref<MenuToggleElement>
                            ) => (
                              <MenuToggle
                                ref={toggleRef}
                                aria-label="row actions dropdown toggle"
                                variant="plain"
                                onClick={() => {
                                  isRowDropdownOpen
                                    ? setIsRowDropdownOpen(null)
                                    : setIsRowDropdownOpen(migrationWave.id);
                                }}
                                isExpanded={isRowDropdownOpen === rowIndex}
                              >
                                <EllipsisVIcon />
                              </MenuToggle>
                            )}
                            shouldFocusToggleOnSelect
                          >
                            <DropdownItem
                              key="edit"
                              component="button"
                              onClick={() => setWaveModalState(migrationWave)}
                            >
                              {t("actions.edit")}
                            </DropdownItem>
                            <ConditionalTooltip
                              key="manage-app"
                              isTooltipEnabled={applications.length === 0}
                              content={
                                "No applications are available for assignment."
                              }
                            >
                              <DropdownItem
                                key="manage-app"
                                isAriaDisabled={applications.length === 0}
                                onClick={() => {
                                  setWaveToManageModalState(migrationWave);
                                }}
                              >
                                {t("composed.manage", {
                                  what: t("terms.applications").toLowerCase(),
                                })}
                              </DropdownItem>
                            </ConditionalTooltip>
                            <ConditionalTooltip
                              key="export-to-issue-manager"
                              isTooltipEnabled={
                                migrationWave.applications?.length < 1 ||
                                !hasExportableApplications(
                                  tickets,
                                  migrationWave?.applications
                                )
                              }
                              content={
                                "No applications are available for export."
                              }
                            >
                              <DropdownItem
                                key="export-to-issue-manager"
                                isAriaDisabled={
                                  migrationWave.applications?.length < 1 ||
                                  !hasExportableApplications(
                                    tickets,
                                    migrationWave?.applications
                                  )
                                }
                                onClick={() =>
                                  setApplicationsToExport(
                                    migrationWave.fullApplications
                                  )
                                }
                              >
                                {t("terms.exportToIssue")}
                              </DropdownItem>
                            </ConditionalTooltip>
                            <DropdownItem
                              key="delete"
                              onClick={() =>
                                setMigrationWaveToDelete({
                                  id: migrationWave.id,
                                  name: migrationWave.name,
                                })
                              }
                            >
                              {t("actions.delete")}
                            </DropdownItem>
                          </Dropdown>
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
                            {isCellExpanded(migrationWave, "applications") &&
                            !!migrationWave.applications.length ? (
                              <WaveApplicationsTable
                                migrationWave={migrationWave}
                                removeApplication={removeApplication}
                              />
                            ) : isCellExpanded(migrationWave, "stakeholders") &&
                              !!migrationWave.allStakeholders.length ? (
                              <WaveStakeholdersTable
                                migrationWave={migrationWave}
                              />
                            ) : (
                              isCellExpanded(migrationWave, "status") && (
                                <WaveStatusTable
                                  migrationWave={migrationWave}
                                  removeApplication={removeApplication}
                                  setCellExpanded={setCellExpanded}
                                />
                              )
                            )}
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    ) : null}
                  </Tbody>
                ))}
              </ConditionalTableBody>
            </Table>
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
        variant={ModalVariant.medium}
        isOpen={isWaveModalOpen}
        onClose={closeWaveModal}
      >
        <WaveForm
          migrationWave={migrationWaveToEdit ? migrationWaveToEdit : undefined}
          onClose={closeWaveModal}
        />
      </Modal>
      {applicationsToExport !== null && (
        <Modal
          title={t("terms.exportToIssue")}
          variant="medium"
          isOpen={true}
          onClose={() => setApplicationsToExport(null)}
        >
          <ExportForm
            applications={applicationsToExport}
            trackers={trackers}
            onClose={() => setApplicationsToExport(null)}
          />
        </Modal>
      )}
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
            applications={applications}
            migrationWave={waveToManageModalState}
            migrationWaves={migrationWaves}
            onClose={() => setWaveToManageModalState(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        title={
          migrationWaveToDelete
            ? t("dialog.title.deleteWithName", {
                what: t("terms.migrationWave").toLowerCase(),
                name: migrationWaveToDelete.name,
              })
            : t("dialog.title.delete", {
                what: t("terms.migrationWave(s)").toLowerCase(),
              })
        }
        isOpen={!!migrationWaveToDelete || !!migrationWavesToDelete}
        titleIconVariant={"warning"}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => {
          setMigrationWaveToDelete(null);
          setMigrationWavesToDelete(null);
        }}
        onClose={() => {
          setMigrationWaveToDelete(null);
          setMigrationWavesToDelete(null);
        }}
        onConfirm={() => {
          if (migrationWaveToDelete) {
            deleteWave(migrationWaveToDelete);
            setMigrationWaveToDelete(null);
          }
          if (migrationWavesToDelete) {
            deleteAllMigrationWaves(
              migrationWavesToDelete.map((id) => deleteMigrationWave(id))
            );
            setMigrationWavesToDelete(null);
          }
        }}
      />
    </>
  );
};

const hasExportableApplications = (tickets: Ticket[], applicationRefs: Ref[]) =>
  applicationRefs.some(
    (applicationRef) =>
      !tickets
        ?.map((ticket) => ticket?.application?.id)
        .includes(applicationRef.id)
  );
