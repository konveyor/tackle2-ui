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

export interface IComposableTableWithControlsProps<T>
  extends TableComposableProps {
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

  columnNames: ColumnNameObj;

  isSelectable?: boolean;
  isRowSelected?: (item: T) => boolean;
  toggleRowSelected?: (item: T, isSelecting?: boolean) => void;

  isExpandable?: boolean;

  renderTableBody: (renderTableBodyParams: {
    renderSelectCheckboxTd: (item: T, rowIndex: number) => React.ReactNode;
    renderExpandedContentTr: (renderExpandedContentParams: {
      isExpanded: boolean;
      expandedColumnName?: string;
      content: React.ReactNode;
    }) => React.ReactNode;
  }) => React.ReactNode;
}

export const ComposableTableWithControls = <T,>({
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
  isSelectable = false,
  isRowSelected,
  toggleRowSelected,
  isExpandable = false,
  variant,
  noDataState,
  renderTableBody,
}: React.PropsWithChildren<
  IComposableTableWithControlsProps<T>
>): JSX.Element | null => {
  const { t } = useTranslation();

  const isUsingSelection = isSelectable && isRowSelected && toggleRowSelected;
  const isUsingActions = !!toolbarActions;

  const numColumns =
    Object.keys(columnNames).length +
    (isUsingSelection ? 1 : 0) +
    (isUsingActions ? 1 : 0);

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
            {isUsingSelection ? <Th /> : null}
            {Object.keys(columnNames).map((nameKey: string) => (
              <Th key={nameKey}>{columnNames[nameKey]}</Th>
            ))}
            {isUsingActions ? <Th /> : null}
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
            renderSelectCheckboxTd: (item, rowIndex) =>
              isUsingSelection ? (
                <Td
                  select={{
                    rowIndex,
                    onSelect: (_event, isSelecting) => {
                      toggleRowSelected(item, isSelecting);
                    },
                    isSelected: isRowSelected(item),
                  }}
                />
              ) : null,
            renderExpandedContentTr: ({
              isExpanded,
              expandedColumnName,
              content,
            }) =>
              isExpandable && isExpanded ? (
                <Tr isExpanded={isExpanded}>
                  <Td
                    dataLabel={expandedColumnName}
                    noPadding
                    colSpan={numColumns}
                    width={100}
                  >
                    <ExpandableRowContent>{content}</ExpandableRowContent>
                  </Td>
                </Tr>
              ) : null,
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
