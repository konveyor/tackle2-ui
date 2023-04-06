import React from "react";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
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
> extends Omit<TableComposableProps, "ref"> {
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

  renderTableBody: (renderTableBodyParams: {
    isCellExpanded: (item: TItem, columnKey?: keyof TColumnNames) => boolean;
    getSelectCheckboxTdProps: (params: {
      item: TItem;
      rowIndex: number;
    }) => Pick<TdProps, "select">;
    getCompoundExpandTdProps: (params: {
      item: TItem;
      rowIndex: number;
      columnKey: keyof TColumnNames;
    }) => Pick<TdProps, "compoundExpand">;
    getExpandedContentTdProps: (params: {
      item: TItem;
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
  noDataState,
  renderTableBody,
  variant,
  ...props
}: React.PropsWithChildren<
  IComposableTableWithControlsProps<TItem, TColumnNames>
>): JSX.Element | null => {
  const { t } = useTranslation();

  const numColumns =
    Object.keys(columnNames).length +
    (isSelectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  // TExpandedCells maps item names to either:
  //  - The key of an expanded column in that row, if the table is compound-expandable
  //  - The `true` literal value (the entire row is expanded), if non-compound-expandable
  type TExpandedCells = Record<string, keyof TColumnNames | boolean>;
  const [expandedCells, setExpandedCells] = React.useState<TExpandedCells>({});
  const setCellExpanded = ({
    item,
    isExpanding = true,
    columnKey,
  }: {
    item: TItem;
    isExpanding?: boolean;
    columnKey?: keyof TColumnNames;
  }) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[item.name] = columnKey || true;
    } else {
      delete newExpandedCells[item.name];
    }
    setExpandedCells(newExpandedCells);
  };
  // isCellExpanded:
  //  - If called with a columnKey, returns whether that specific cell is expanded
  //  - If called without a columnKey, returns whether the row is expanded at all
  const isCellExpanded = (item: TItem, columnKey?: keyof TColumnNames) =>
    columnKey
      ? expandedCells[item.name] === columnKey
      : !!expandedCells[item.name];

  // TODO we will need to adapt this to regular-expandable and not just compound-expandable
  // (probably just means the addition of a renderExpandToggleTd in renderTableBody)

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
      <TableComposable variant={variant} {...props}>
        <Thead>
          <Tr>
            {/* TODO is this a problem if we have a table that needs modifier props on these Th elements? maybe we'll need an optional `tableHeader` prop that overrides this? */}
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
            isCellExpanded,
            getSelectCheckboxTdProps: ({ item, rowIndex }) => ({
              select: {
                rowIndex,
                onSelect: (_event, isSelecting) => {
                  toggleRowSelected(item, isSelecting);
                },
                isSelected: isRowSelected(item),
              },
            }),
            getCompoundExpandTdProps: ({ item, rowIndex, columnKey }) => ({
              compoundExpand: {
                isExpanded: isCellExpanded(item, columnKey),
                onToggle: () =>
                  setCellExpanded({
                    item,
                    isExpanding: !isCellExpanded(item, columnKey),
                    columnKey,
                  }),
                expandId: `compound-expand-${item.name}-${columnKey as string}`,
                rowIndex,
                columnIndex: Object.keys(columnNames).indexOf(
                  columnKey as string
                ),
              },
            }),
            getExpandedContentTdProps: ({ item }) => {
              const expandedColumnKey = expandedCells[item.name];
              return {
                dataLabel:
                  typeof expandedColumnKey === "string"
                    ? columnNames[expandedColumnKey]
                    : undefined,
                noPadding: true,
                colSpan: numColumns,
                width: 100,
              };
            },
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
