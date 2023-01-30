import React from "react";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TdProps,
  ExpandableRowContent,
} from "@patternfly/react-table";

import { Application, Stakeholder, Wave } from "@app/api/models";
import dayjs from "dayjs";
import {
  AppTableWithControls,
  StateError,
  ToolbarBulkSelector,
} from "@app/shared/components";
import { useSelectionState } from "@migtools/lib-ui";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  Bullseye,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import {
  PaginationStateProps,
  usePaginationState,
} from "@app/shared/hooks/usePaginationState";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { SimplePagination } from "@app/shared/components/simple-pagination";

const waves: Wave[] = [
  {
    name: "wave1",
    id: 0,
    startDate: "2018-02-03 22:15:01",
    endDate: "2020-01-03 22:15:014",
    applications: [{ name: "app1" }, { name: "app2" }],
    stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
    status: "n/a",
  },
  {
    name: "wave2",
    id: 2,
    startDate: "2019-03-03 22:15:01",
    endDate: "2020-01-03 22:15:014",
    applications: [{ name: "app3" }, { name: "app4" }],
    stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
    status: "n/a",
  },
];

export interface IComposableWaveTableWithControlsProps {
  withoutTopPagination?: boolean;
  withoutBottomPagination?: boolean;
  toolbarBulkSelector?: any;
  toolbarToggle?: any;
  toolbarActions?: any;
  toolbarClearAllFilters?: () => void;
  paginationIdPrefix?: string;
  isLoading: boolean;
  fetchError: any;
  errorState?: any;
}

export const ComposableWaveTableWithControls: React.FC<
  IComposableWaveTableWithControlsProps
> = ({
  withoutTopPagination,
  withoutBottomPagination,
  toolbarBulkSelector,
  toolbarToggle,
  toolbarActions,
  toolbarClearAllFilters,
  paginationIdPrefix,
  isLoading,
  fetchError,
  errorState,
}) => {
  const { t } = useTranslation();

  //TODO: Make dynamic
  const columnNames = {
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
  };

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
  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    waves || [],
    filterCategories
  );
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

  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };
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

  //

  return (
    <div style={{ backgroundColor: "var(--pf-global--BackgroundColor--100)" }}>
      <Toolbar
        className="pf-m-toggle-group-container"
        collapseListedFiltersBreakpoint="xl"
        clearAllFilters={handleOnClearAllFilters}
        clearFiltersButtonText={t("actions.clearAllFilters")}
      >
        <ToolbarContent>
          <ToolbarBulkSelector
            onSelectAll={selectAll}
            areAllSelected={areAllSelected}
            selectedRows={selectedRows}
            paginationProps={paginationProps}
            currentPageItems={currentPageItems}
            onSelectMultiple={selectMultiple}
          />
          <FilterToolbar<Wave>
            filterCategories={filterCategories}
            filterValues={filterValues}
            setFilterValues={setFilterValues}
          />
          {toolbarActions}
          {!withoutTopPagination && (
            <ToolbarItem
              variant={ToolbarItemVariant.pagination}
              alignment={{ default: "alignRight" }}
            >
              <SimplePagination
                idPrefix={paginationIdPrefix}
                isTop={true}
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
      <TableComposable aria-label="waves-table">
        <Thead>
          <Tr>
            <Th
              select={{
                onSelect: (_event, isSelecting) => selectAll(isSelecting),
                isSelected: areAllSelected,
              }}
            />
            <Th>{columnNames.name}</Th>
            <Th>{columnNames.startDate}</Th>
            <Th>{columnNames.endDate}</Th>
            <Th>{columnNames.applications}</Th>
            <Th>{columnNames.stakeholders}</Th>
            <Th>{columnNames.status}</Th>
            <Th />
          </Tr>
        </Thead>
        {currentPageItems.map((wave: Wave, rowIndex: number) => {
          const expandedCellKey = expandedCells[wave.name];
          const isRowExpanded = !!expandedCellKey;
          if (isLoading) {
            <Tbody>
              <Tr>
                <Td colSpan={8}>
                  <Bullseye>
                    <Spinner size="xl" />
                  </Bullseye>
                </Td>
              </Tr>
            </Tbody>;
          }
          if (fetchError) {
            return (
              <>
                <Tbody aria-label="Waves table error">
                  <Tr>
                    <Td colSpan={8}>
                      <Bullseye>
                        {errorState ? errorState : <StateError />}
                      </Bullseye>
                    </Td>
                  </Tr>
                </Tbody>
              </>
            );
          }

          return (
            <Tbody key={wave.name} isExpanded={isRowExpanded}>
              <Tr>
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) =>
                      // onSelectRow(repo, rowIndex, isSelecting),
                      toggleRowSelected(wave, isSelecting),
                    isSelected: isRowSelected(wave),
                  }}
                />
                <Td width={25} dataLabel={columnNames.name} component="th">
                  {wave.name}
                </Td>
                <Td width={25} dataLabel={columnNames.startDate} component="th">
                  {dayjs(wave.startDate).format("DD/MM/YYYY")}
                </Td>
                <Td width={25} dataLabel={columnNames.endDate} component="th">
                  {dayjs(wave.endDate).format("DD/MM/YYYY")}
                </Td>
                <Td
                  width={10}
                  dataLabel={columnNames.applications}
                  compoundExpand={compoundExpandParams(
                    wave,
                    "applications",
                    rowIndex,
                    1
                  )}
                >
                  {wave.applications.length}
                </Td>
                <Td
                  width={10}
                  dataLabel={columnNames.stakeholders}
                  compoundExpand={compoundExpandParams(
                    wave,
                    "stakeholders",
                    rowIndex,
                    2
                  )}
                >
                  {wave.stakeholders.length}
                </Td>
                <Td width={15} dataLabel={columnNames.status}>
                  {wave.status}
                </Td>
              </Tr>
              {isRowExpanded ? (
                <Tr isExpanded={isRowExpanded}>
                  <Td
                    dataLabel={columnNames[expandedCellKey]}
                    noPadding
                    colSpan={6}
                  >
                    {expandedCellKey === "applications" && (
                      <ExpandableRowContent>
                        <div className="pf-u-m-md">
                          {wave.applications.map((app) => (
                            <div>{app.name}</div>
                          ))}
                        </div>
                      </ExpandableRowContent>
                    )}

                    {expandedCellKey === "stakeholders" && (
                      <ExpandableRowContent>
                        <div className="pf-u-m-md">
                          {wave.stakeholders.map((sh) => (
                            <div>
                              {sh.name} - {sh.email}
                            </div>
                          ))}
                        </div>
                      </ExpandableRowContent>
                    )}
                  </Td>
                </Tr>
              ) : null}
            </Tbody>
          );
        })}
      </TableComposable>
      {!withoutBottomPagination && (
        <SimplePagination
          idPrefix={paginationIdPrefix}
          isTop={false}
          paginationProps={paginationProps}
        />
      )}
    </div>
  );
};
