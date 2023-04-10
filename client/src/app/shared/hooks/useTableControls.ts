import React from "react";
import { useTranslation } from "react-i18next";

import {
  Toolbar,
  ToolbarItemProps,
  ToolbarProps,
} from "@patternfly/react-core";
import { Table, TableComposableProps, TdProps } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useCompoundExpansionState } from "./useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { IToolbarBulkSelectorProps } from "../components/toolbar-bulk-selector/toolbar-bulk-selector";
import { FilterCategory } from "../components/FilterToolbar";
import { useFilterState } from "./useFilterState";
import { useSortState } from "./useSortState";
import { usePaginationState } from "./usePaginationState";

// TODO add a prop for expandable mode? 'single' | 'compound' | null?

export interface UseTableControlsArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> {
  id: string;
  items: TItem[]; // The objects represented by rows in this table
  columnNames: TColumnNames; // An ordered mapping of unique keys to human-readable column name strings
  isSelectable?: boolean;
  hasActionsColumn?: boolean;
  variant?: TableComposableProps["variant"];
  filterCategories?: FilterCategory<TItem>[];
  filterStorageKey?: string;
  getSortValues?: (item: TItem) => Record<keyof TColumnNames, string>;
  hasPagination?: boolean;
  initialItemsPerPage?: number;
}

export const useTableControls = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>({
  items,
  columnNames,
  isSelectable = false,
  hasActionsColumn = false,
  variant,
  filterCategories = [],
  filterStorageKey,
  getSortValues,
  hasPagination = true,
  initialItemsPerPage = 10,
}: UseTableControlsArgs<TItem, TColumnNames>) => {
  const { t } = useTranslation();

  const numRenderedColumns =
    Object.keys(columnNames).length +
    (isSelectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  // TODO also if the table has a single-expand toggle (non-compound expandable rows), add 1 more here
  const firstDataColumnIndex = 0 + (isSelectable ? 1 : 0);

  const filterState = useFilterState(items, filterCategories, filterStorageKey);
  const { setFilterValues, filteredItems } = filterState;

  const expansionState = useCompoundExpansionState<TItem, TColumnNames>();
  const { expandedCells, setCellExpanded, isCellExpanded } = expansionState;

  const selectionState = useSelectionState<TItem>({
    items: filteredItems || [],
    isEqual: (a, b) => a.name === b.name,
  });
  const {
    isItemSelected,
    toggleItemSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems,
  } = selectionState;

  const sortState = useSortState(
    filteredItems,
    getSortValues
      ? (item) => {
          // Because useSortState is based on column indexes and we want to base everything on columnKey,
          // we need to convert to an array of strings based on column index here.
          // TODO rewrite or write an alternate useSortState to be based on columnKey instead.
          const sortValuesByColumnKey = getSortValues(item);
          return [
            ...(firstDataColumnIndex > 0
              ? new Array(firstDataColumnIndex).fill("")
              : []),
            ...Object.keys(columnNames).map(
              (columnKey) => sortValuesByColumnKey[columnKey] || ""
            ),
          ];
        }
      : undefined
  );
  const { sortedItems } = sortState;

  const paginationState = usePaginationState(sortedItems, initialItemsPerPage);
  const currentPageItems = hasPagination
    ? paginationState.currentPageItems
    : sortedItems;
  const { paginationProps } = paginationState;

  const toolbarProps: ToolbarProps = {
    className: variant === "compact" ? spacing.pt_0 : "",
    collapseListedFiltersBreakpoint: "xl",
    clearAllFilters: () => setFilterValues({}),
    clearFiltersButtonText: t("actions.clearAllFilters"),
  };

  // TODO how to abstract the toolbarToggle, toolbarActions props?

  const paginationToolbarItemProps: ToolbarItemProps = {
    variant: "pagination",
    alignment: { default: "alignRight" },
  };

  const tableProps: TableComposableProps = { variant };

  const toolbarBulkSelectorProps: IToolbarBulkSelectorProps<TItem> = {
    onSelectAll: selectAll,
    areAllSelected,
    selectedRows: selectedItems,
    paginationProps,
    currentPageItems,
    onSelectMultiple: selectMultiple,
  };

  // TODO how to handle the Thead / column name headers?

  const getSelectCheckboxTdProps = ({
    item,
    rowIndex,
  }: {
    item: TItem;
    rowIndex: number;
  }): TdProps => ({
    select: {
      rowIndex,
      onSelect: (_event, isSelecting) => {
        toggleItemSelected(item, isSelecting);
      },
      isSelected: isItemSelected(item),
    },
  });

  const getCompoundExpandTdProps = ({
    item,
    rowIndex,
    columnKey,
  }: {
    item: TItem;
    rowIndex: number;
    columnKey: keyof TColumnNames;
  }): TdProps => ({
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
      columnIndex: Object.keys(columnNames).indexOf(columnKey as string),
    },
  });

  const getExpandedContentTdProps = ({ item }: { item: TItem }): TdProps => {
    const expandedColumnKey = expandedCells[item.name];
    return {
      dataLabel:
        typeof expandedColumnKey === "string"
          ? columnNames[expandedColumnKey]
          : undefined,
      noPadding: true,
      colSpan: numRenderedColumns,
      width: 100,
    };
  };

  return {
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
      tableProps,
      toolbarBulkSelectorProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
      getExpandedContentTdProps,
    },
    filterState,
    expansionState,
    selectionState,
    sortState,
    paginationState,
  };
};

// TODO refactor the waves table to use this?
// TODO refactor the jira table to use this?
