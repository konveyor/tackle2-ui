import React from "react";
import { useTranslation } from "react-i18next";
import { ToolbarItemProps, ToolbarProps } from "@patternfly/react-core";
import {
  TableComposableProps,
  TdProps,
  Td,
  ThProps,
  Th,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useTableControlState } from "./useTableControlState";
import { IToolbarBulkSelectorProps } from "@app/shared/components/toolbar-bulk-selector/toolbar-bulk-selector";
import { IFilterToolbarProps } from "@app/shared/components/FilterToolbar";
import { objectKeys } from "@app/utils/utils";

export interface UseTableControlPropsAdditionalArgs {
  variant?: TableComposableProps["variant"];
}

export type UseTableControlPropsArgs<
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
> = ReturnType<typeof useTableControlState<TItem, TColumnNames>> &
  UseTableControlPropsAdditionalArgs;

export const useTableControlProps = <
  TItem extends { name: string },
  TColumnNames extends Record<string, string>
>(
  args: UseTableControlPropsArgs<TItem, TColumnNames>
) => {
  const { t } = useTranslation();

  const {
    numRenderedColumns,
    filterCategories,
    filterState: { filterValues, setFilterValues },
    expansionState: { isCellExpanded, setCellExpanded, expandedCells },
    selectionState: {
      selectAll,
      areAllSelected,
      selectedItems,
      selectMultiple,
      toggleItemSelected,
      isItemSelected,
    },
    sortState, // TODO prop helpers for sorting stuff
    paginationState: { paginationProps, currentPageItems },
    variant,
    columnNames,
  } = args;

  const toolbarProps: Omit<ToolbarProps, "ref"> = {
    className: variant === "compact" ? spacing.pt_0 : "",
    collapseListedFiltersBreakpoint: "xl",
    clearAllFilters: () => setFilterValues({}),
    clearFiltersButtonText: t("actions.clearAllFilters"),
  };

  const tableProps: Omit<TableComposableProps, "ref"> = { variant };

  const toolbarBulkSelectorProps: IToolbarBulkSelectorProps<TItem> = {
    onSelectAll: selectAll,
    areAllSelected,
    selectedRows: selectedItems,
    paginationProps,
    currentPageItems,
    onSelectMultiple: selectMultiple,
  };

  const filterToolbarProps: IFilterToolbarProps<TItem> = {
    filterCategories: filterCategories!,
    filterValues,
    setFilterValues,
  };

  const paginationToolbarItemProps: ToolbarItemProps = {
    variant: "pagination",
    alignment: { default: "alignRight" },
  };

  // TODO how to handle the Thead / column name headers?

  const getSelectCheckboxTdProps = ({
    item,
    rowIndex,
  }: {
    item: TItem;
    rowIndex: number;
  }): Omit<TdProps, "ref"> => ({
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
  }): Omit<TdProps, "ref"> => ({
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
      columnIndex: objectKeys(columnNames).indexOf(columnKey),
    },
  });

  const getExpandedContentTdProps = ({
    item,
  }: {
    item: TItem;
  }): Omit<TdProps, "ref"> => {
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

  const cellComponents = React.useMemo(
    () =>
      objectKeys(columnNames).reduce((newObj, columnKey) => {
        const ThisColumnTh: typeof Th = React.forwardRef((props, ref) => {
          return <Th children={columnNames[columnKey]} {...props} ref={ref} />;
        });
        const ThisColumnTd: typeof Td = React.forwardRef((props, ref) => {
          return <Td dataLabel={columnNames[columnKey]} {...props} ref={ref} />;
        });
        return {
          ...newObj,
          [columnKey]: { Th: ThisColumnTh, Td: ThisColumnTd },
        };
      }, {} as Record<keyof TColumnNames, { Th: typeof Th; Td: typeof Td }>),
    [columnNames]
  );

  return {
    ...args,
    propHelpers: {
      toolbarProps,
      tableProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
      getExpandedContentTdProps,
    },
    cellComponents,
  };
};
