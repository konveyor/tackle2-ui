import * as React from "react";
import {
  Button,
  ButtonVariant,
  DropdownItem,
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
import { useFetchMigrationWaves } from "@app/queries/waves";
import {
  AppPlaceholder,
  ConditionalRender,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { MigrationWave } from "@app/api/models";
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { WaveApplicationsTable } from "./wave-applications-table/wave-applications-table";
import { WaveStakeholdersTable } from "./wave-stakeholders-table/wave-stakeholders-table";
import { CreateEditWaveModal } from "./components/create-edit-wave-modal";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
dayjs.extend(utc);

export const Waves: React.FC = () => {
  const { t } = useTranslation();

  const { waves, isFetching, fetchError } = useFetchMigrationWaves();

  const [waveModalState, setWaveModalState] = React.useState<
    "create" | MigrationWave | null
  >(null);
  const isWaveModalOpen = waveModalState !== null;
  const waveBeingEdited = waveModalState !== "create" ? waveModalState : null;
  const openCreateWaveModal = () => setWaveModalState("create");
  const openEditWaveModal = (wave: MigrationWave) => setWaveModalState(wave);
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

  console.log({ selectedItems });

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
                              // onClick={() => setExportIssueModalOpen(true)}
                            >
                              {t("actions.export")}
                            </DropdownItem>,
                            <DropdownItem
                              key="bulk-delete"
                              // onClick={() => {
                              // }}
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
                                        key="bulk-export-to-issue-manager"
                                        component="button"
                                        // onClick={() => setExportIssueModalOpen(true)}
                                      >
                                        {t("actions.export")}
                                      </DropdownItem>,
                                      <DropdownItem
                                        key="bulk-delete"
                                        // onClick={() => {
                                        // }}
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
      <CreateEditWaveModal
        isOpen={isWaveModalOpen}
        waveBeingEdited={waveBeingEdited}
        onSaved={closeWaveModal}
        onCancel={closeWaveModal}
      />
    </>
  );
};
