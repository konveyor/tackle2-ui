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
  useDeleteAllMigrationWavesMutation,
  useDeleteMigrationWaveMutation,
  useFetchMigrationWaves,
  useUpdateMigrationWaveMutation,
} from "@app/queries/migration-waves";
import {
  AppPlaceholder,
  ConditionalRender,
  ConfirmDialog,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { MigrationWave, Ref } from "@app/api/models";
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
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { ExportForm } from "./components/export-form";

import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError, AxiosResponse } from "axios";
import { useFetchTrackers } from "@app/queries/trackers";
import { useFetchApplications } from "@app/queries/applications";
import { WaveStakeholdersTable } from "./components/stakeholders-table";
import { WaveApplicationsTable } from "./components/wave-applications-table";
import { WaveStatusTable } from "./components/wave-status-table";
import { WaveForm } from "./components/migration-wave-form";
import { ManageApplicationsForm } from "./components/manage-applications-form";
import { deleteMigrationWave } from "@app/api/rest";
import { ConditionalTooltip } from "@app/shared/components/ConditionalTooltip";

dayjs.extend(utc);

export const MigrationWaves: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { migrationWaves, isFetching, fetchError, refetch } =
    useFetchMigrationWaves();

  const { trackers: trackers } = useFetchTrackers();
  const { data: applications } = useFetchApplications();

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

  const onDeleteAllMigrationWavesSuccess = (response: any) => {
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
    migrationWave.applications = migrationWave.applications.filter(
      (application) => application.id !== id
    );
    updateMigrationWave(migrationWave);
  };

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
    expansionDerivedState: { isCellExpanded },
  } = tableControls;
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
                                  selectedItems.flatMap(
                                    (item) => item.applications
                                  )
                                )
                              }
                            >
                              {t("terms.exportToIssue")}
                            </DropdownItem>,
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
                            {migrationWave.allStakeholders.length}
                          </Td>
                          <Td
                            width={20}
                            {...((!!migrationWave.applications.length ||
                              migrationWave.status === "No Issues") &&
                              getCompoundExpandTdProps({
                                item: migrationWave,
                                rowIndex,
                                columnKey: "status",
                              }))}
                          >
                            {!!migrationWave.applications.length
                              ? migrationWave.status
                              : "N/A"}
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
                                        onClick={() =>
                                          setWaveModalState(migrationWave)
                                        }
                                      >
                                        {t("actions.edit")}
                                      </DropdownItem>,
                                      <ConditionalTooltip
                                        key="no-applications"
                                        isTooltipEnabled={
                                          applications.length === 0
                                        }
                                        content={
                                          "No applications are available for assignment."
                                        }
                                      >
                                        <DropdownItem
                                          key="manage-app"
                                          isDisabled={applications.length === 0}
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
                                        </DropdownItem>
                                      </ConditionalTooltip>,
                                      <DropdownItem
                                        key="export-to-issue-manager"
                                        component="button"
                                        isDisabled={
                                          migrationWave.applications.length < 1
                                        }
                                        onClick={() =>
                                          setApplicationsToExport(
                                            migrationWave.fullApplications
                                          )
                                        }
                                      >
                                        {t("terms.exportToIssue")}
                                      </DropdownItem>,
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
                              {isCellExpanded(migrationWave, "applications") &&
                              !!migrationWave.applications.length ? (
                                <WaveApplicationsTable
                                  migrationWave={migrationWave}
                                  removeApplication={removeApplication}
                                />
                              ) : isCellExpanded(
                                  migrationWave,
                                  "stakeholders"
                                ) && !!migrationWave.allStakeholders.length ? (
                                <WaveStakeholdersTable
                                  migrationWave={migrationWave}
                                />
                              ) : (
                                isCellExpanded(migrationWave, "status") && (
                                  <WaveStatusTable
                                    migrationWave={migrationWave}
                                    removeApplication={removeApplication}
                                  />
                                )
                              )}
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
            ? t("dialog.title.delete", {
                what: t("terms.migrationWave").toLowerCase(),
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
