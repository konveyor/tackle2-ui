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
import { Application, Wave } from "@app/api/models";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSelectionState } from "@migtools/lib-ui";
import { TdProps } from "@patternfly/react-table";
import dayjs from "dayjs";
import { IComposableRow } from "@app/shared/components/composable-table-with-controls/composable-table-with-controls";
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
    select: "",
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
    actions: "",
  };

  //Compound expandable code
  type ColumnKey = keyof typeof columnNames;

  const [expandedCells, setExpandedCells] = React.useState<
    Record<string, ColumnKey>
  >({
    wave1: "applications", // Default to the first cell of the first row being expanded
  });
  const setCellExpanded = (
    application: Application,
    columnKey: ColumnKey,
    isExpanding = true
  ) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[application.name] = columnKey;
    } else {
      delete newExpandedCells[application.name];
    }
    setExpandedCells(newExpandedCells);
  };
  const compoundExpandParams = (
    application: Application,
    columnKey: ColumnKey,
    rowIndex: number,
    columnIndex: number
  ): TdProps["compoundExpand"] => ({
    isExpanded: expandedCells[application.name] === columnKey,
    onToggle: () =>
      setCellExpanded(
        application,
        columnKey,
        expandedCells[application.name] !== columnKey
      ),
    expandId: "composable-compound-expandable-example",
    rowIndex,
    columnIndex,
  });
  const handleIsRowSelected = (row: IComposableRow) => {
    const matchingWave = waves.find((wave) => wave.name === row.name);
    return matchingWave ? isRowSelected(matchingWave) : false;
  };
  const handleToggleRowSelected = (
    row: IComposableRow,
    isSelecting: boolean
  ) => {
    const matchingWave = waves.find((wave) => wave.name === row.name);
    matchingWave && toggleRowSelected(matchingWave, isSelecting);
  };
  //RBAC
  // xxxxWriteAccess = checkAccess(userScopes, waveWriteScopes);
  const waveRowDropdownItems = true //TODO: Check RBAC access
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
    : [];
  //

  const rows: IComposableRow[] = [];
  currentPageItems?.forEach((item, index) => {
    const expandedCellKey = expandedCells[item.name];
    const isRowExpanded = !!expandedCellKey;
    const isSelected = isRowSelected(item);
    rows.push({
      name: item.name,
      isExpanded: isRowExpanded,
      expandedCellKey: expandedCellKey,
      isSelected: isSelected,
      expandedContentMap: {
        applications: (
          <WaveApplicationsTable
            applications={item.applications}
          ></WaveApplicationsTable>
        ),
        stakeholders: (
          <WaveStakeholdersTable
            stakeholders={item.stakeholders}
          ></WaveStakeholdersTable>
        ),
      },
      cells: [
        {
          title: item.name,
          width: 25,
        },
        {
          title: dayjs(item.startDate).format("DD/MM/YYYY"),
          width: 10,
        },
        {
          title: dayjs(item.endDate).format("DD/MM/YYYY"),
          width: 10,
        },
        {
          title: item?.applications?.length.toString(),
          compoundExpand: compoundExpandParams(item, "applications", index, 1),
          width: 10,
        },
        {
          title: item?.stakeholders?.length.toString(),
          compoundExpand: compoundExpandParams(item, "stakeholders", index, 1),
          width: 10,
        },
        {
          title: "Status",
          width: 20,
        },
        {
          children: (
            <KebabDropdown dropdownItems={waveRowDropdownItems}></KebabDropdown>
          ),
          width: 10,
        },
      ],
    });
  });

  //RBAC
  // xxxxWriteAccess = checkAccess(userScopes, waveWriteScopes);
  const waveDropdownItems = true //TODO: Check RBAC access
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
    : [];
  //
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
          <ComposableTableWithControls
            isSelectable={true}
            handleToggleRowSelected={handleToggleRowSelected}
            handleIsRowSelected={handleIsRowSelected}
            toolbarActions={
              <>
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
                  {waveDropdownItems.length ? (
                    <ToolbarItem>
                      <KebabDropdown
                        dropdownItems={waveDropdownItems}
                      ></KebabDropdown>
                    </ToolbarItem>
                  ) : (
                    <></>
                  )}
                </ToolbarGroup>
              </>
            }
            rowItems={rows}
            columnNames={columnNames}
            isLoading={isFetching}
            fetchError={fetchError}
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
          ></ComposableTableWithControls>
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
