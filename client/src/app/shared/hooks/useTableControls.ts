import React from "react";
import { useTranslation } from "react-i18next";

import {
  Toolbar,
  ToolbarItemProps,
  ToolbarProps,
} from "@patternfly/react-core";
import { Table, TableComposableProps, TdProps } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useCompoundExpandableState } from "./useCompoundExpandableState";

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
}: UseTableControlsArgs<TItem, TColumnNames>) => {
  const { t } = useTranslation();

  const { expandedCells, setCellExpanded, isCellExpanded } =
    useCompoundExpandableState<TItem, TColumnNames>();

  // TODO useFilterState?
  // TODO usePaginationState?
  // TODO useSortState?
  // TODO useSelectionState??? or should that remain external?

  const toolbarProps: Partial<ToolbarProps> = {
    className: variant === "compact" ? spacing.pt_0 : "",
    collapseListedFiltersBreakpoint: "xl",
    clearAllFilters: toolbarClearAllFilters,
    clearFiltersButtonText: t("actions.clearAllFilters"),
  };

  // TODO how to abstract the toolbarBulkSelector, toolbarToggle, toolbarActions props?

  const paginationToolbarItemProps: Partial<ToolbarItemProps> = {
    variant: "pagination",
    alignment: { default: "alignRight" },
  };

  const tableProps: Partial<TableComposableProps> = { variant };

  // TODO how to handle the Thead / column name headers?

  const numRenderedColumns =
    Object.keys(columnNames).length +
    (isSelectable ? 1 : 0) +
    (hasActionsColumn ? 1 : 0);

  const getSelectCheckboxTdProps = ({
    item,
    rowIndex,
  }: {
    item: TItem;
    rowIndex: number;
  }): Partial<TdProps> => ({
    select: {
      rowIndex,
      onSelect: (_event, isSelecting) => {
        toggleRowSelected(item, isSelecting);
      },
      isSelected: isRowSelected(item),
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
  }): Partial<TdProps> => ({
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

  const getExpandedContentTdProps = ({
    item,
  }: {
    item: TItem;
  }): Partial<TdProps> => {
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
    toolbarProps,
    tableProps,
    paginationToolbarItemProps,
    getSelectCheckboxTdProps,
    getCompoundExpandTdProps,
    getExpandedContentTdProps,
    numRenderedColumns,
    expandedCells,
    setCellExpanded,
    isCellExpanded,
  };
};

// TODO refactor the waves table to use this?
// TODO refactor the jira table to use this?
