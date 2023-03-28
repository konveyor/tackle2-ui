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
  TrProps,
  TableComposableProps,
} from "@patternfly/react-table";

import { StateError } from "@app/shared/components";
import {
  Bullseye,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { PaginationStateProps } from "@app/shared/hooks/usePaginationState";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import { TdCompoundExpandType } from "@patternfly/react-table/dist/esm/components/Table/base";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { StateNoData } from "../app-table/state-no-data";

export interface IRowCell extends TdProps {
  isExpanded?: boolean;
  compoundExpand?: TdCompoundExpandType;
}
export interface IComposableRow extends TrProps {
  isExpanded?: boolean;
  expandedCellKey?: any;
  isSelected?: boolean;
  cells: IRowCell[];
  expandedContentMap?: { [key: string]: any };
}
type ColumnNameObj = { [key: string]: string };

export interface IComposableWaveTableWithControlsProps
  extends TableComposableProps {
  withoutTopPagination?: boolean;
  withoutBottomPagination?: boolean;
  toolbarBulkSelector?: any;
  toolbarToggle?: any;
  toolbarActions?: any;
  toolbarClearAllFilters?: () => void;
  paginationProps: PaginationStateProps;
  paginationIdPrefix?: string;
  isLoading?: boolean;
  fetchError?: any;
  errorState?: any;
  columnNames: ColumnNameObj;

  rowItems: any[];
  handleIsRowSelected?: (item: IComposableRow) => boolean;
  handleToggleRowSelected?: (
    item: IComposableRow,
    isSelecting: boolean
  ) => void;
  isSelectable?: boolean;
  noDataState?: any;
}

export const ComposableAppTable: React.FC<
  IComposableWaveTableWithControlsProps
> = ({
  withoutTopPagination,
  withoutBottomPagination,
  toolbarBulkSelector,
  toolbarToggle,
  toolbarActions,
  toolbarClearAllFilters,
  paginationProps,
  paginationIdPrefix,
  isLoading,
  fetchError,
  errorState,
  columnNames,
  rowItems,
  handleIsRowSelected,
  handleToggleRowSelected,
  isSelectable,
  variant,
  noDataState,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ backgroundColor: "var(--pf-global--BackgroundColor--100)" }}>
      <Toolbar
        className={variant === "compact" ? spacing.pt_0 : ""}
        collapseListedFiltersBreakpoint="xl"
        clearAllFilters={toolbarClearAllFilters}
        clearFiltersButtonText={t("actions.clearAllFilters")}
      >
        <ToolbarContent>
          {toolbarBulkSelector}
          {toolbarToggle}
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
      <TableComposable aria-label="waves-table" variant={variant}>
        <Thead>
          <Tr>
            {Object.keys(columnNames).map((name: string) => (
              <Th>{columnNames[name]}</Th>
            ))}
            <Th />
          </Tr>
        </Thead>
        {isLoading && (
          <Tbody>
            <Tr>
              <Td colSpan={8}>
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        )}
        {fetchError && (
          <Tbody aria-label="Table error">
            <Tr>
              <Td colSpan={8}>
                <Bullseye>{errorState ? errorState : <StateError />}</Bullseye>
              </Td>
            </Tr>
          </Tbody>
        )}
        {!!rowItems && (
          <Tbody aria-label="Tablerror">
            <Tr>
              <Td colSpan={8}>
                <Bullseye>
                  {noDataState ? noDataState : <StateNoData />}
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        )}

        {rowItems.map((row: IComposableRow, rowIndex: number) => {
          return (
            <Tbody key={row.id} isExpanded={row.isExpanded}>
              <Tr>
                {isSelectable &&
                  handleToggleRowSelected &&
                  handleIsRowSelected && (
                    <Td
                      select={{
                        rowIndex,
                        onSelect: (_event, isSelecting) => {
                          handleToggleRowSelected(row, isSelecting);
                        },
                        isSelected: handleIsRowSelected(row),
                      }}
                    />
                  )}
                {row.cells.map((cell: IRowCell, i) => (
                  <Td
                    width={cell.width}
                    dataLabel={cell.id}
                    component="th"
                    compoundExpand={cell.compoundExpand}
                    className={cell.className}
                    style={cell.style}
                  >
                    {cell.title}
                    {cell.children}
                  </Td>
                ))}
              </Tr>
              {!!row.expandedContentMap && row.isExpanded ? (
                <Tr isExpanded={row.isExpanded}>
                  <Td
                    dataLabel={columnNames[row.expandedCellKey]}
                    noPadding
                    colSpan={8}
                    width={100}
                  >
                    {Object.keys(row.expandedContentMap).map(
                      (expandableRowName: string) => {
                        if (row.expandedCellKey === expandableRowName) {
                          return (
                            <ExpandableRowContent>
                              {!!row.expandedContentMap &&
                                row.expandedContentMap[expandableRowName]}
                            </ExpandableRowContent>
                          );
                        } else {
                          return;
                        }
                      }
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
