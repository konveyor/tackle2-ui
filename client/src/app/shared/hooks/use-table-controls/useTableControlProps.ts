import * as React from "react";
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

import { IToolbarBulkSelectorProps } from "@app/shared/components/toolbar-bulk-selector/toolbar-bulk-selector";
import {
  FilterCategory,
  IFilterToolbarProps,
} from "@app/shared/components/FilterToolbar";
import { objectKeys } from "@app/utils/utils";
import { useCompoundExpansionState } from "../useCompoundExpansionState";
import { useSelectionState } from "@migtools/lib-ui";
import { useFilterState } from "../useFilterState";
import { IPaginationState } from "./pagination/usePaginationState";
import { ISortState } from "./sorting/useSortState";

export interface UseTableControlPropsArgs<
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey // A subset of column keys as a separate narrower type
> {
  // Params also required by useTableControlState:
  columnNames: Record<TColumnKey, string>;
  filterCategories?: FilterCategory<TItem>[];
  sortableColumns?: TSortableColumnKey[];
  // Params returned by useTableControlState:
  // TODO maybe break these down explicitly too...
  filterState: ReturnType<typeof useFilterState<TItem>>;
  expansionState: ReturnType<
    typeof useCompoundExpansionState<TItem, TColumnKey>
  >;
  selectionState: ReturnType<typeof useSelectionState<TItem>>;
  sortState: ISortState<TSortableColumnKey>;
  paginationState: IPaginationState;
  currentPageItems: TItem[];
  // Additional params only for useTableControlProps:
  totalItemCount: number;
  isSelectable?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
  isLoading?: boolean;
  variant?: TableComposableProps["variant"];
}

export const useTableControlProps = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: UseTableControlPropsArgs<TItem, TColumnKey, TSortableColumnKey>
) => {
  const { t } = useTranslation();

  const {
    currentPageItems,
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
    isLoading = false,
    variant,
  } = args;

  const columnKeys = objectKeys(columnNames);

  // Some table controls rely on extra columns inserted before or after the ones included in columnNames.
  // We need to account for those when dealing with props based on column index and colSpan.
  let numColumnsBeforeData = 0;
  let numColumnsAfterData = 0;
  if (isSelectable) numColumnsBeforeData++;
  if (expandableVariant === "single") numColumnsBeforeData++;
  if (hasActionsColumn) numColumnsAfterData++;
  const numRenderedColumns =
    columnKeys.length + numColumnsBeforeData + numColumnsAfterData;

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

  // When items are removed, make sure the current page still exists
  const lastPageNumber = Math.max(Math.ceil(totalItemCount / itemsPerPage), 1);
  React.useEffect(() => {
    if (pageNumber > lastPageNumber && !isLoading) {
      setPageNumber(lastPageNumber);
    }
  });

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
    columnKey: TColumnKey;
  }): Omit<ThProps, "ref"> => ({
    ...(sortableColumns.includes(columnKey as TSortableColumnKey)
      ? {
          sort: {
            columnIndex: columnKeys.indexOf(columnKey),
            sortBy: {
              index: activeSort
                ? columnKeys.indexOf(activeSort.columnKey as TSortableColumnKey)
                : undefined,
              direction: activeSort?.direction,
            },
            onSort: (event, index, direction) => {
              setActiveSort({
                columnKey: columnKeys[index] as TSortableColumnKey,
                direction,
              });
            },
          },
        }
      : {}),
    children: columnNames[columnKey],
  });

  const getTdProps = ({
    columnKey,
  }: {
    columnKey: TColumnKey;
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

  const getSingleExpandTdProps = ({
    item,
    rowIndex,
  }: {
    item: TItem;
    rowIndex: number;
  }): Omit<TdProps, "ref"> => ({
    expand: {
      rowIndex,
      isExpanded: isCellExpanded(item),
      onToggle: () =>
        setCellExpanded({
          item,
          isExpanding: !isCellExpanded(item),
        }),
      expandId: `expandable-row-${item.name}`,
    },
  });

  const getCompoundExpandTdProps = ({
    item,
    rowIndex,
    columnKey,
  }: {
    item: TItem;
    rowIndex: number;
    columnKey: TColumnKey;
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
      columnIndex: columnKeys.indexOf(columnKey),
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
      getSingleExpandTdProps,
      getExpandedContentTdProps,
    },
  };
};
