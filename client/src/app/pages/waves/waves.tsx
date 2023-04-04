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
import { Tbody, Td, Tr } from "@patternfly/react-table";
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

  //Compound expandable code
  type ColumnKey = keyof typeof columnNames;

  // TODO can we abstract this into the component? should we?
  const [expandedCells, setExpandedCells] = React.useState<
    Record<string, ColumnKey>
  >({
    wave1: "applications", // Default to the first cell of the first row being expanded
  });
  const setCellExpanded = (
    wave: Wave,
    columnKey: ColumnKey,
    isExpanding = true
  ) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[wave.name] = columnKey;
    } else {
      delete newExpandedCells[wave.name];
    }
    setExpandedCells(newExpandedCells);
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
          when={isFetching && !(waves || fetchError)}
          then={<AppPlaceholder />}
        >
          <ComposableTableWithControls<Wave, typeof columnNames>
            isSelectable
            isRowSelected={isRowSelected}
            toggleRowSelected={toggleRowSelected}
            isExpandable
            isRowExpanded={(wave, columnKey) =>
              columnKey
                ? expandedCells[wave.name] === columnKey
                : !!expandedCells[wave.name]
            }
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
            isLoading={isFetching}
            fetchError={fetchError}
            isNoData={currentPageItems.length === 0}
            paginationProps={paginationProps}
            toolbarBulkSelector={
              // TODO can we abstract this into the component? should we?
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
              // TODO can we abstract this into the component? should we?
              <FilterToolbar<Wave>
                filterCategories={filterCategories}
                filterValues={filterValues}
                setFilterValues={setFilterValues}
              />
            }
            toolbarClearAllFilters={handleOnClearAllFilters}
            renderTableBody={({
              renderSelectCheckboxTd,
              renderExpandedContentTr,
              renderCompoundExpandTd,
            }) => (
              <>
                {currentPageItems?.map((wave, rowIndex) => {
                  return (
                    <Tbody
                      key={wave.id}
                      isExpanded={!!expandedCells[wave.name]}
                    >
                      <Tr>
                        {renderSelectCheckboxTd(wave, rowIndex)}
                        <Td width={25}>{wave.name}</Td>
                        <Td width={10}>
                          {dayjs(wave.startDate).format("DD/MM/YYYY")}
                        </Td>
                        <Td width={10}>
                          {dayjs(wave.endDate).format("DD/MM/YYYY")}
                        </Td>
                        {renderCompoundExpandTd({
                          item: wave,
                          rowIndex,
                          columnKey: "applications",
                          onToggle: () =>
                            setCellExpanded(
                              wave,
                              "applications",
                              expandedCells[wave.name] !== "applications"
                            ),
                          tdProps: { width: 10 },
                          content: wave?.applications?.length.toString(),
                        })}
                        {renderCompoundExpandTd({
                          item: wave,
                          rowIndex,
                          columnKey: "stakeholders",
                          onToggle: () =>
                            setCellExpanded(
                              wave,
                              "stakeholders",
                              expandedCells[wave.name] !== "stakeholders"
                            ),
                          tdProps: { width: 10 },
                          content: wave?.applications?.length.toString(),
                        })}

                        <Td width={20}>Status</Td>
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
                      {renderExpandedContentTr({
                        item: wave,
                        expandedColumnKey: expandedCells[wave.name],
                        content:
                          expandedCells[wave.name] === "applications" ? (
                            // TODO restore this
                            /*
                            <WaveApplicationsTable
                              applications={wave.applications}
                            />
                            */
                            <h1>TODO expanded content here for Applications</h1>
                          ) : expandedCells[wave.name] === "stakeholders" ? (
                            // TODO restore this
                            /*
                            <WaveStakeholdersTable
                              stakeholders={wave.stakeholders}
                            />
                            */
                            <h1>TODO expanded content here for Stakeholders</h1>
                          ) : null,
                      })}
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
