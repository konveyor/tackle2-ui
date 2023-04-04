import React from "react";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
  TableComposableProps,
  TdProps,
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
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { StateNoData } from "../app-table/state-no-data";

export interface IComposableTableWithControlsProps<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> extends TableComposableProps {
  withoutTopPagination?: boolean;
  withoutBottomPagination?: boolean;
  toolbarBulkSelector?: React.ReactNode;
  toolbarToggle?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  toolbarClearAllFilters?: () => void;
  paginationProps: PaginationStateProps;
  paginationIdPrefix?: string;
  isLoading?: boolean;
  fetchError?: unknown;
  errorState?: React.ReactNode;
  isNoData?: boolean;
  noDataState?: React.ReactNode;

  columnNames: TColumnNames;
  hasActionsColumn?: boolean;

  isSelectable?: boolean;
  isRowSelected?: (item: TItem) => boolean;
  toggleRowSelected?: (item: TItem, isSelecting?: boolean) => void;

  // TODO we will need to adapt this to regular-expandable and not just compound-expandable
  // (probably just means the addition of a renderExpandToggleTd in renderTableBody)
  isExpandable?: boolean;
  isRowExpanded?: (item: TItem, columnKey?: keyof TColumnNames) => boolean;

  renderTableBody: (renderTableBodyParams: {
    getSelectCheckboxTdProps: (params: {
      item: TItem;
      rowIndex: number;
    }) => Pick<TdProps, "select">;
    getCompoundExpandTdProps: (params: {
      item: TItem;
      rowIndex: number;
      columnKey: keyof TColumnNames;
      onToggle: () => void;
    }) => Pick<TdProps, "compoundExpand">;
    getExpandedContentTdProps: (params: {
      expandedColumnKey?: keyof TColumnNames;
    }) => Pick<TdProps, "dataLabel" | "noPadding" | "colSpan" | "width">;
  }) => React.ReactNode;
}

export const ComposableTableWithControls = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>({
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
  isNoData = false,
  errorState,
  columnNames,
  hasActionsColumn = false,
  isSelectable = false,
  isRowSelected = () => false,
  toggleRowSelected = () => {},
  isExpandable = false,
  isRowExpanded = () => false,
  variant,
  noDataState,
  renderTableBody,
}: React.PropsWithChildren<
  IComposableTableWithControlsProps<TItem, TColumnNames>
>): JSX.Element | null => {
  const { t } = useTranslation();

  const numColumns =
    Object.keys(columnNames).length +
    (isSelectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  // TODO FIXME, this just prevents rendering tables we haven't converted to use render props yet
  if (typeof renderTableBody !== "function") return null;

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
            {isSelectable ? <Th /> : null}
            {Object.keys(columnNames).map((columnKey: string) => (
              <Th key={columnKey}>{columnNames[columnKey]}</Th>
            ))}
            {hasActionsColumn ? <Th /> : null}
          </Tr>
        </Thead>
        {isLoading ? (
          <Tbody>
            <Tr>
              <Td colSpan={numColumns}>
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        ) : fetchError ? (
          <Tbody aria-label="Table error">
            <Tr>
              <Td colSpan={numColumns}>
                <Bullseye>{errorState ? errorState : <StateError />}</Bullseye>
              </Td>
            </Tr>
          </Tbody>
        ) : isNoData ? (
          <Tbody aria-label="Table error">
            <Tr>
              <Td colSpan={numColumns}>
                <Bullseye>
                  {noDataState ? noDataState : <StateNoData />}
                </Bullseye>
              </Td>
            </Tr>
          </Tbody>
        ) : (
          renderTableBody({
            getSelectCheckboxTdProps: ({ item, rowIndex }) => ({
              select: {
                rowIndex,
                onSelect: (_event, isSelecting) => {
                  toggleRowSelected(item, isSelecting);
                },
                isSelected: isRowSelected(item),
              },
            }),
            getCompoundExpandTdProps: ({
              item,
              rowIndex,
              columnKey,
              onToggle,
            }) => ({
              compoundExpand: {
                isExpanded: isRowExpanded(item, columnKey),
                onToggle, // TODO maybe we bring the setCellExpanded state into here?
                expandId: `compound-expand-${item.name}-${columnKey as string}`,
                rowIndex,
                columnIndex: Object.keys(columnNames).indexOf(
                  columnKey as string
                ),
              },
            }),
            getExpandedContentTdProps: ({ expandedColumnKey }) => ({
              dataLabel: expandedColumnKey && columnNames[expandedColumnKey],
              noPadding: true,
              colSpan: numColumns,
              width: 100,
            }),
          })
        )}
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
