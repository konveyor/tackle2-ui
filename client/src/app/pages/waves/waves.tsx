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
import { useFetchWaves } from "@app/queries/waves";
import {
  AppPlaceholder,
  ConditionalRender,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { Wave } from "@app/api/models";
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
import { WaveApplicationsTable } from "./wave-applications-table/wave-applications-table";
import { WaveStakeholdersTable } from "./wave-stakeholders-table/wave-stakeholders-table";
import { CreateEditWaveModal } from "./components/create-edit-wave-modal";
import { useTableControls } from "@app/shared/hooks/use-table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import { ConditionalTableBody } from "@app/shared/components/table-controls";

export const Waves: React.FC = () => {
  const { t } = useTranslation();

  const { waves, isFetching, fetchError } = useFetchWaves();

  // When waveModalState is:
  //   'create': the modal is open for creating a new wave.
  //   A Wave: the modal is open for editing that wave.
  //   null: the modal is closed.
  const [waveModalState, setWaveModalState] = React.useState<
    "create" | Wave | null
  >(null);
  const isWaveModalOpen = waveModalState !== null;
  const waveBeingEdited = waveModalState !== "create" ? waveModalState : null;
  const openCreateWaveModal = () => setWaveModalState("create");
  const openEditWaveModal = (wave: Wave) => setWaveModalState(wave);
  const closeWaveModal = () => setWaveModalState(null);

  const columnNames = {
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
  } as const;

  const {
    numRenderedColumns,
    expansionState: { isCellExpanded },
    selectionState: { selectedItems },
    paginationState: {
      paginationProps, // TODO maybe paginationProps should be in propHelpers and not part of the responsibility of usePaginationState
      currentPageItems,
    },
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      tableProps,
      getExpandedContentTdProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
    },
  } = useTableControls({
    items: waves,
    columnNames,
    isSelectable: true,
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
    getSortValues: (wave: Wave) => ({
      name: wave.name || "",
      startDate: wave.startDate || "",
      endDate: wave.endDate || "",
      applications: wave.applications.length,
      stakeholders: wave.stakeholders.length,
      status: "TODO: Status",
    }),
    hasPagination: true,
    initialItemsPerPage: 10,
  });

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
            <TableComposable {...tableProps}>
              <Thead>
                {/* TODO is there any way we can abstract this Thead into a component? how do we make sure we can still put modifier props on the Th for each column? */}
                <Th /* Checkbox column */ />
                {Object.keys(columnNames).map((columnKey) => (
                  <Th key={columnKey}>
                    {columnNames[columnKey as keyof typeof columnNames]}
                  </Th>
                ))}
                <Th /* Actions column */ />
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
                        <Td
                          {...getSelectCheckboxTdProps({
                            item: wave,
                            rowIndex,
                          })}
                        />
                        <Td width={25} dataLabel={columnNames.name}>
                          {wave.name}
                        </Td>
                        <Td width={10} dataLabel={columnNames.startDate}>
                          {dayjs(wave.startDate).format("DD/MM/YYYY")}
                        </Td>
                        <Td width={10} dataLabel={columnNames.endDate}>
                          {dayjs(wave.endDate).format("DD/MM/YYYY")}
                        </Td>
                        <Td
                          width={10}
                          dataLabel={columnNames.applications}
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
                          dataLabel={columnNames.stakeholders}
                          {...getCompoundExpandTdProps({
                            item: wave,
                            rowIndex,
                            columnKey: "stakeholders",
                          })}
                        >
                          {wave?.stakeholders?.length.toString()}
                        </Td>
                        <Td width={20} dataLabel={columnNames.status}>
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
        onSaved={() => {}}
        onCancel={closeWaveModal}
      />
    </>
  );
};
