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
} from "@app/queries/waves";
import {
  AppPlaceholder,
  ConditionalRender,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { Application, MigrationWave } from "@app/api/models";
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
import { WaveApplicationsTable } from "./wave-applications-table/wave-applications-table";
import { WaveStakeholdersTable } from "./wave-stakeholders-table/wave-stakeholders-table";
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
import { AxiosError } from "axios";
import { WaveForm } from "./wave-form";
dayjs.extend(utc);

export const Waves: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { waves, isFetching, fetchError, refetch } = useFetchMigrationWaves();

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

  const [waveModalState, setWaveModalState] = React.useState<
    "create" | MigrationWave | null
  >(null);
  const isWaveModalOpen = waveModalState !== null;
  const waveToEdit = waveModalState !== "create" ? waveModalState : null;
  const openCreateWaveModal = () => setWaveModalState("create");

  const [exportIssueModalOpen, setExportIssueModalOpen] = React.useState(false);
  const [applicationsToExport, setApplicationsToExport] = React.useState<
    Application[]
  >([]);

  const closeWaveModal = () => setWaveModalState(null);

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: waves,
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
    getSortValues: (wave) => ({
      name: wave.name || "",
      startDate: wave.startDate || "",
      endDate: wave.endDate || "",
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

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.migrationWaves")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(waves || fetchError)}
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
                      id="create-wave"
                      aria-label="Create new wave"
                      variant={ButtonVariant.primary}
                      onClick={openCreateWaveModal}
                    >
                      {t("actions.createNew")}
                    </Button>
                  </ToolbarItem>
                  {/* </RBAC> */}
                  {
                    //RBAC
                    // xxxxWriteAccess = checkAccess(userScopes, waveWriteScopes);
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
                                selectedItems.map((wave) => {
                                  if (wave.id)
                                    deleteWave({
                                      id: wave.id,
                                      name: wave.name,
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
                    idPrefix="migration-waves-table"
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
                isNoData={waves.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((wave, rowIndex) => {
                  return (
                    <Tbody key={wave.id} isExpanded={isCellExpanded(wave)}>
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={wave}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {wave.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "startDate" })}
                          >
                            {dayjs.utc(wave.startDate).format("MM/DD/YYYY")}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "endDate" })}
                          >
                            {dayjs.utc(wave.endDate).format("MM/DD/YYYY")}
                          </Td>
                          <Td
                            width={10}
                            {...getCompoundExpandTdProps({
                              item: wave,
                              rowIndex,
                              columnKey: "applications",
                            })}
                          >
                            {wave?.applications?.length.toString()}
                          </Td>
                          <Td
                            width={10}
                            {...getCompoundExpandTdProps({
                              item: wave,
                              rowIndex,
                              columnKey: "stakeholders",
                            })}
                          >
                            {wave?.stakeholders?.length.toString()}
                          </Td>
                          <Td
                            width={20}
                            {...getTdProps({ columnKey: "status" })}
                          >
                            TODO: Status
                          </Td>
                          <Td width={10}>
                            <KebabDropdown
                              dropdownItems={
                                //RBAC
                                // xxxxWriteAccess = checkAccess(userScopes, waveWriteScopes);
                                true //TODO: Check RBAC access
                                  ? [
                                      <DropdownItem
                                        key="edit"
                                        component="button"
                                        onClick={() => setWaveModalState(wave)}
                                      >
                                        {t("actions.edit")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="bulk-export-to-issue-manager"
                                        component="button"
                                        onClick={() => {
                                          setApplicationsToExport(
                                            wave.applications
                                          );
                                          setExportIssueModalOpen(true);
                                        }}
                                      >
                                        {t("actions.export")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="delete"
                                        onClick={() => {
                                          if (wave.id)
                                            deleteWave({
                                              id: wave.id,
                                              name: wave.name,
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
                      {isCellExpanded(wave) ? (
                        <Tr isExpanded>
                          <Td {...getExpandedContentTdProps({ item: wave })}>
                            <ExpandableRowContent>
                              {isCellExpanded(wave, "applications") ? (
                                <WaveApplicationsTable
                                  wave={wave}
                                  applications={wave.applications}
                                />
                              ) : isCellExpanded(wave, "stakeholders") ? (
                                <WaveStakeholdersTable
                                  wave={wave}
                                  stakeholders={wave.stakeholders}
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
              idPrefix="migration-waves-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <Modal
        id="create-edit-wave-modal"
        title={
          waveToEdit
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
          wave={waveToEdit ? waveToEdit : undefined}
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
    </>
  );
};
