import * as React from "react";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
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
  OverflowMenu,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import {
  ActionsColumn,
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { MigrationWave, Ref, Ticket, WaveWithStatus } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { isInClosedRange } from "@app/components/FilterToolbar/dateUtils";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ToolbarBulkExpander } from "@app/components/ToolbarBulkExpander";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { useBulkSelection } from "@app/hooks/selection/useBulkSelection";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchApplications } from "@app/queries/applications";
import {
  useDeleteAllMigrationWavesMutation,
  useDeleteMigrationWaveMutation,
  useFetchMigrationWaves,
  useUpdateMigrationWaveMutation,
} from "@app/queries/migration-waves";
import { useFetchTickets } from "@app/queries/tickets";
import { useFetchTrackers } from "@app/queries/trackers";
import { toRefs } from "@app/utils/model-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ExportForm } from "./components/export-form";
import { ManageApplicationsForm } from "./components/manage-applications-form";
import { WaveForm } from "./components/migration-wave-form";
import { WaveStakeholdersTable } from "./components/stakeholders-table";
import { WaveApplicationsTable } from "./components/wave-applications-table";
import { WaveStatusTable } from "./components/wave-status-table";

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

  const [migrationWaveToDelete, setMigrationWaveToDelete] =
    React.useState<MigrationWave | null>(null);

  const [migrationWavesToDelete, setMigrationWavesToDelete] = React.useState<
    MigrationWave[] | null
  >(null);

  const onDeleteWaveSuccess = (migrationWave: MigrationWave) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        type: t("terms.migrationWave"),
        what: migrationWave.name,
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

  const onDeleteAllMigrationWavesSuccess = (
    migrationWaves: MigrationWave[]
  ) => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        count: migrationWaves.length,
        type: t("terms.migrationWave", {
          count: migrationWaves.length,
        }).toLowerCase(),
      }),
      variant: "success",
    });
  };

  const { mutate: deleteAllMigrationWaves } =
    useDeleteAllMigrationWavesMutation(
      onDeleteAllMigrationWavesSuccess,
      onError
    );

  const onUpdateMigrationWaveSuccess = (migrationWave: MigrationWave) =>
    pushNotification({
      title: t("toastr.success.saveWhat", {
        type: t("terms.migrationWave"),
        what: migrationWave.name,
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

  const tableControls = useLocalTableControls<WaveWithStatus, string, string>({
    tableName: "migration-waves-table",
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
        categoryKey: "startDate",
        title: t("terms.startDate"),
        type: FilterType.dateRange,
        matcher: (interval, item) => isInClosedRange(interval, item.startDate),
      },
      {
        categoryKey: "endDate",
        title: t("terms.endDate"),
        type: FilterType.dateRange,
        matcher: (interval, item) => isInClosedRange(interval, item.endDate),
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
    filteredItems,
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      toolbarBulkExpanderProps,
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

  const {
    selectedItems,
    propHelpers: { toolbarBulkSelectorProps, getSelectCheckboxTdProps },
  } = useBulkSelection({
    isEqual: (a, b) => a.id === b.id,
    filteredItems,
    currentPageItems,
  });

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
                <ToolbarBulkExpander {...toolbarBulkExpanderProps} />
                <ToolbarBulkSelector {...toolbarBulkSelectorProps!} />
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
                            setMigrationWavesToDelete(selectedItems)
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
                    <Th screenReaderText="row actions" />
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
                        getSelectCheckboxTdProps={getSelectCheckboxTdProps}
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
                          {rbacWriteAccess && (
                            <OverflowMenu breakpoint="sm">
                              <Tooltip content={t("actions.edit")}>
                                <Button
                                  aria-label={t("actions.edit")}
                                  variant="plain"
                                  icon={<PencilAltIcon />}
                                  onClick={() =>
                                    setWaveModalState(migrationWave)
                                  }
                                />
                              </Tooltip>
                              <ActionsColumn
                                items={[
                                  {
                                    title: t("composed.manage", {
                                      what: t(
                                        "terms.applications"
                                      ).toLowerCase(),
                                    }),
                                    onClick: () => {
                                      setWaveToManageModalState(migrationWave);
                                    },
                                    isAriaDisabled: !applications?.length,
                                    tooltipProps: !applications?.length
                                      ? {
                                          content: t(
                                            "message.noApplicationsForAssignment"
                                          ),
                                        }
                                      : undefined,
                                  },
                                  {
                                    title: t("terms.exportToIssue"),
                                    onClick: () =>
                                      setApplicationsToExport(
                                        migrationWave.fullApplications
                                      ),
                                    isAriaDisabled:
                                      migrationWave.applications?.length < 1 ||
                                      !hasExportableApplications(
                                        tickets,
                                        migrationWave?.applications
                                      ),
                                    tooltipProps:
                                      migrationWave.applications?.length < 1 ||
                                      !hasExportableApplications(
                                        tickets,
                                        migrationWave?.applications
                                      )
                                        ? {
                                            content: t(
                                              "message.noApplicationsForExport"
                                            ),
                                          }
                                        : undefined,
                                  },
                                  {
                                    title: t("actions.delete"),
                                    onClick: () =>
                                      setMigrationWaveToDelete(migrationWave),
                                    isDanger: true,
                                  },
                                ]}
                              />
                            </OverflowMenu>
                          )}
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
        key={
          migrationWaveModalState === "create"
            ? 0
            : (migrationWaveToEdit?.id ?? -1)
        }
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

      <ConfirmDeleteSingleMigrationWave
        migrationWaveToDelete={migrationWaveToDelete}
        onCancel={() => setMigrationWaveToDelete(null)}
        onConfirm={() => {
          if (migrationWaveToDelete) {
            deleteWave(migrationWaveToDelete);
            setMigrationWaveToDelete(null);
          }
        }}
      />

      <ConfirmDeleteMultipleMigrationWave
        migrationWaves={migrationWavesToDelete}
        onCancel={() => setMigrationWavesToDelete(null)}
        onConfirm={() => {
          if (migrationWavesToDelete) {
            deleteAllMigrationWaves(migrationWavesToDelete);
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

const ConfirmDeleteSingleMigrationWave: React.FC<{
  migrationWaveToDelete: MigrationWave | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ migrationWaveToDelete, onCancel, onConfirm }) => {
  const { t } = useTranslation();

  if (!migrationWaveToDelete) {
    return null;
  }

  return (
    <ConfirmDialog
      title={t("dialog.title.deleteWithName", {
        what: t("terms.migrationWave").toLowerCase(),
        name: migrationWaveToDelete.name,
      })}
      isOpen={true}
      titleIconVariant={"warning"}
      message={t("dialog.message.delete")}
      confirmBtnVariant={ButtonVariant.danger}
      confirmBtnLabel={t("actions.delete")}
      cancelBtnLabel={t("actions.cancel")}
      onCancel={onCancel}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
};

const ConfirmDeleteMultipleMigrationWave: React.FC<{
  migrationWaves: MigrationWave[] | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ migrationWaves, onCancel, onConfirm }) => {
  const { t } = useTranslation();

  if (!migrationWaves || migrationWaves.length === 0) {
    return null;
  }

  return (
    <ConfirmDialog
      title={t("dialog.title.deleteMultiple", {
        count: migrationWaves.length,
        what: t("terms.migrationWave", {
          count: migrationWaves.length,
        }).toLowerCase(),
      })}
      isOpen={true}
      titleIconVariant={"warning"}
      message={t("dialog.message.delete")}
      confirmBtnVariant={ButtonVariant.danger}
      confirmBtnLabel={t("actions.delete")}
      cancelBtnLabel={t("actions.cancel")}
      onCancel={onCancel}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
};
