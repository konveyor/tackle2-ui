import React from "react";
import {
  Bullseye,
  Spinner,
  Skeleton,
  EmptyState,
  Button,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from "@patternfly/react-core";
import {
  Table,
  TableHeader,
  TableBody,
  IRow,
  TableProps,
  ExpandableRowContent,
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  TableComposableProps,
} from "@patternfly/react-table";

import "./app-table-composable.css";
import { StateError } from "../app-table/state-error";
import { StateNoData } from "../app-table/state-no-data";
import { StateNoResults } from "../app-table/state-no-results";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";

export interface IAppTableComposableProps extends TableComposableProps {
  isLoading: boolean;
  loadingVariant?: "skeleton" | "spinner" | "none";
  fetchError?: any;

  filtersApplied?: boolean;
  noDataState?: any;
  noSearchResultsState?: any;
  errorState?: any;
  isSelectable?: boolean;
  composableColumns: any[];
  composableRows: any[];
}

export const AppTableComposable: React.FC<IAppTableComposableProps> = ({
  composableColumns,
  composableRows,
  "aria-label": ariaLabel = "main-table",

  isLoading,
  fetchError,
  loadingVariant = "skeleton",

  filtersApplied,
  noDataState,
  noSearchResultsState,
  errorState,

  isSelectable,

  ...rest
}) => {
  return (
    <TableComposable aria-label={ariaLabel}>
      <Thead>
        <Tr>
          {isSelectable && (
            <Th
              select={{
                onSelect: (_event, isSelecting) => selectAll(isSelecting),
                isSelected: areAllSelected,
              }}
            />
          )}
          {columns.map((column) => (
            <Th>{column.name} </Th>
          ))}
        </Tr>
      </Thead>
      {items.map((item: Wave, rowIndex: number) => {
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
              <Tbody aria-label={ariaLabel}>
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
        if (composableRows.length === 0) {
          return filtersApplied ? (
            <>
              {noSearchResultsState ? noSearchResultsState : <StateNoResults />}
            </>
          ) : (
              {noDataState ? noDataState : <StateNoData />}
          );
        }

        return (
          <Tbody key={wave.name} isExpanded={isRowExpanded}>
            <Tr>
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
  );
};
