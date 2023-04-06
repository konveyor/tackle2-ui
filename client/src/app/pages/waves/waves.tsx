import * as React from "react";
import {
  Button,
  ButtonVariant,
  DropdownItem,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useFetchWaves } from "@app/queries/waves";
import { ComposableTableWithControls } from "@app/shared/components/composable-table-with-controls";
import {
  AppPlaceholder,
  ConditionalRender,
  KebabDropdown,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { Wave } from "@app/api/models";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSelectionState } from "@migtools/lib-ui";
import { ExpandableRowContent, Tbody, Td, Tr } from "@patternfly/react-table";
import dayjs from "dayjs";
import { WaveApplicationsTable } from "./wave-applications-table/wave-applications-table";
import { WaveStakeholdersTable } from "./wave-stakeholders-table/wave-stakeholders-table";
import { CreateEditWaveModal } from "./components/create-edit-wave-modal";

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

  const filterCategories: FilterCategory<Wave>[] = [
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
  ];

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    waves || [],
    filterCategories
  );
  //Bulk selection
  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Wave>({
    items: filteredItems || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const getSortValues = (item: Wave) => [
    "",
    item?.name || "",
    "", // Action column
  ];

  // TODO add sort stuff to ComposableTableWithControls
  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  const columnNames = {
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
  } as const;

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
          <ComposableTableWithControls<Wave, typeof columnNames>
            isSelectable
            isRowSelected={isRowSelected}
            toggleRowSelected={toggleRowSelected}
            toolbarActions={
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
            }
            columnNames={columnNames}
            hasActionsColumn
            isLoading={isFetching}
            fetchError={fetchError}
            isNoData={waves.length === 0}
            paginationProps={paginationProps}
            toolbarBulkSelector={
              <ToolbarBulkSelector
                onSelectAll={selectAll}
                areAllSelected={areAllSelected}
                selectedRows={selectedRows}
                paginationProps={paginationProps}
                currentPageItems={currentPageItems}
                onSelectMultiple={selectMultiple}
              />
            }
            toolbarToggle={
              <FilterToolbar<Wave>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
            toolbarClearAllFilters={handleOnClearAllFilters}
            renderTableBody={({
              isCellExpanded,
              getSelectCheckboxTdProps,
              getCompoundExpandTdProps,
              getExpandedContentTdProps,
            }) => (
              <>
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
                          Status
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
              </>
            )}
          />
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
