import { useTranslation } from "react-i18next";
import {
  PaginationProps,
  ToolbarItemProps,
  ToolbarProps,
} from "@patternfly/react-core";
import {
  TableComposableProps,
  TdProps,
  ThProps,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { useTableControlState } from "./useTableControlState";
import { IToolbarBulkSelectorProps } from "@app/shared/components/toolbar-bulk-selector/toolbar-bulk-selector";
import { IFilterToolbarProps } from "@app/shared/components/FilterToolbar";
import { objectKeys } from "@app/utils/utils";

export interface UseTableControlPropsAdditionalArgs {
  isSelectable?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
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
    totalItemCount,
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
    sortState: { activeSort, setActiveSort },
    paginationState: {
      currentPageItems,
      pageNumber,
      setPageNumber,
      itemsPerPage,
      setItemsPerPage,
    },
    columnNames,
    sortableColumns = [],
    isSelectable = false,
    expandableVariant = null,
    hasActionsColumn = false,
    variant,
  } = args;

  // Some table controls rely on extra columns inserted before or after the ones included in columnNames.
  // We need to account for those when dealing with props based on column index and colSpan.
  let numColumnsBeforeData = 0;
  let numColumnsAfterData = 0;
  if (isSelectable) numColumnsBeforeData++;
  if (expandableVariant === "single") numColumnsBeforeData++;
  if (hasActionsColumn) numColumnsAfterData++;
  const numRenderedColumns =
    Object.keys(columnNames).length +
    numColumnsBeforeData +
    numColumnsAfterData;

  const toolbarProps: Omit<ToolbarProps, "ref"> = {
    className: variant === "compact" ? spacing.pt_0 : "",
    collapseListedFiltersBreakpoint: "xl",
    clearAllFilters: () => setFilterValues({}),
    clearFiltersButtonText: t("actions.clearAllFilters"),
  };

  const paginationProps: PaginationProps = {
    itemCount: totalItemCount,
    perPage: itemsPerPage,
    page: pageNumber,
    onSetPage: (event, pageNumber) => setPageNumber(pageNumber),
    onPerPageSelect: (event, perPage) => {
      setPageNumber(1);
      setItemsPerPage(perPage);
    },
  };

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

  const tableProps: Omit<TableComposableProps, "ref"> = { variant };

  const getThProps = ({
    columnKey,
  }: {
    columnKey: keyof TColumnNames;
  }): Omit<ThProps, "ref"> => {
    const columnKeys = objectKeys(columnNames);
    return {
      ...(sortableColumns.includes(columnKey)
        ? {
            sort: {
              columnIndex: columnKeys.indexOf(columnKey),
              sortBy: {
                index: activeSort
                  ? columnKeys.indexOf(activeSort.columnKey)
                  : undefined,
                direction: activeSort?.direction,
              },
              onSort: (event, index, direction) => {
                setActiveSort({ columnKey: columnKeys[index], direction });
              },
            },
          }
        : {}),
      children: columnNames[columnKey],
    };
  };

  const getTdProps = ({
    columnKey,
  }: {
    columnKey: keyof TColumnNames;
  }): Omit<TdProps, "ref"> => ({
    dataLabel: columnNames[columnKey],
  });

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
    ...getTdProps({ columnKey }),
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

  return {
    ...args,
    numColumnsBeforeData,
    numColumnsAfterData,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      toolbarBulkSelectorProps,
      filterToolbarProps,
      paginationProps,
      paginationToolbarItemProps,
      tableProps,
      getThProps,
      getTdProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
      getExpandedContentTdProps,
    },
  };
};
