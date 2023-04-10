import { useTranslation } from "react-i18next";
import { ToolbarItemProps, ToolbarProps } from "@patternfly/react-core";
import { TableComposableProps, TdProps } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useTableControlState } from "./useTableControlState";
import { IToolbarBulkSelectorProps } from "@app/shared/components/toolbar-bulk-selector/toolbar-bulk-selector";

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
    filterState: { setFilterValues },
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
    ...args,
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
      tableProps,
      toolbarBulkSelectorProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
      getExpandedContentTdProps,
    },
  };
};
