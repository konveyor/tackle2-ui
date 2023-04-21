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
import { usePaginationState } from "../usePaginationState";
import { useSortState } from "../useSortState";

// TODO step 1: clean up the params here so we pass in state setters/getters and derived state separately
//     this will break the tables that use useTableControlState
// TODO step 2: fix what we're passing in in the dependencies table, make sure it's good and what we want
//     we may have to add generics for TColumnKey to useTableControlUrlParams
// TODO step 3: fix the return values here in useTableControlProps so it makes sense with the separation of derived state
// TODO step 4: change useTableControlState so it returns the new format (monkeypatch the return values of the individual hooks)
//     make sure this fixes the tables that use useTableControlState via useTableControls -- rename to useClientTableControls?
// TODO step 5: break apart useTableControlUrlParams into individual hooks for the slices of state -- how to avoid clobbering each other on batch updates?
//     all updates are one setter with the whole params object that has optional fields? do we abstract that away? that's weird right? is there a way to atomically function-update them? maybe on setter call, reference document.location instead of the useLocation result? still need useLocation for the auto re-render
//     test that by synchronously calling setSort and setPagination together or something
// TODO step 5: break derived state out in the original use*State hooks? use common return types omitting the derived part?
// TODO step 6: break apart the pieces of useTableControlProps into slices too? all consistent?
// TODO step 7: add selectionState and expansionState to the URL params? need to convert to using id/name instead of reference for selection state, is that worth it?
//     maybe rename useCompoundExpansionState to useExpandableState / useExpandableRowState

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
  sortState: ReturnType<typeof useSortState<TItem, TSortableColumnKey>>;
  paginationState: ReturnType<typeof usePaginationState<TItem>>;
  // Additional params only for useTableControlProps:
  totalItemCount: number;
  isSelectable?: boolean;
  expandableVariant?: "single" | "compound" | null;
  hasActionsColumn?: boolean;
  variant?: TableComposableProps["variant"];
}

// TODO maybe break this up into multiple hooks that get composed together for props related to filters/sorting/pagination

export const useTableControlProps = <
  TItem extends { name: string },
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey
>(
  args: UseTableControlPropsArgs<TItem, TColumnKey, TSortableColumnKey>
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
