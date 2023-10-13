import { useTranslation } from "react-i18next";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { objectKeys } from "@app/utils/utils";
import { ITableControls, IUseTableControlPropsArgs } from "./types";
import { getFilterProps } from "./filtering";
import { getSortProps } from "./sorting";
import { getPaginationProps, usePaginationEffects } from "./pagination";
import { getActiveRowDerivedState, useActiveRowEffects } from "./active-row";
import { handlePropagatedRowClick } from "./utils";
import { getExpansionDerivedState } from "./expansion";
import { getActiveRowProps } from "./active-row/getActiveRowProps";

export const useTableControlProps = <
  TItem,
  TColumnKey extends string,
  TSortableColumnKey extends TColumnKey,
  TFilterCategoryKey extends string = string,
  TPersistenceKeyPrefix extends string = string,
>(
  args: IUseTableControlPropsArgs<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >
): ITableControls<
  TItem,
  TColumnKey,
  TSortableColumnKey,
  TFilterCategoryKey,
  TPersistenceKeyPrefix
> => {
  type PropHelpers = ITableControls<
    TItem,
    TColumnKey,
    TSortableColumnKey,
    TFilterCategoryKey,
    TPersistenceKeyPrefix
  >["propHelpers"];

  const { t } = useTranslation();

  // Note: To avoid repetition, not all args are destructured here since the entire
  //       args object is passed to other other helpers which require other parts of it.
  //       For future additions, inspect `args` to see if it has anything more you need.
  const {
    currentPageItems,
    forceNumRenderedColumns,
    filterState: { setFilterValues },
    expansionState: { expandedCells },
    selectionState: {
      selectAll,
      areAllSelected,
      selectedItems,
      selectMultiple,
      toggleItemSelected,
      isItemSelected,
    },
    columnNames,
    hasActionsColumn = false,
    variant,
    idProperty,
    isFilterEnabled,
    isSortEnabled,
    isSelectionEnabled,
    isExpansionEnabled,
    isActiveRowEnabled,
  } = args;

  const expandableVariant =
    (isExpansionEnabled && args.expandableVariant) || undefined;

  const columnKeys = objectKeys(columnNames);

  // Some table controls rely on extra columns inserted before or after the ones included in columnNames.
  // We need to account for those when dealing with props based on column index and colSpan.
  let numColumnsBeforeData = 0;
  let numColumnsAfterData = 0;
  if (isSelectionEnabled) numColumnsBeforeData++;
  if (isExpansionEnabled && expandableVariant === "single")
    numColumnsBeforeData++;
  if (hasActionsColumn) numColumnsAfterData++;
  const numRenderedColumns =
    forceNumRenderedColumns ||
    columnKeys.length + numColumnsBeforeData + numColumnsAfterData;

  const expansionDerivedState = getExpansionDerivedState(args);
  const { isCellExpanded, setCellExpanded } = expansionDerivedState;

  const activeRowDerivedState = getActiveRowDerivedState(args);
  useActiveRowEffects({ ...args, activeRowDerivedState });
  const { activeRowItem, setActiveRowItem, clearActiveRow } =
    activeRowDerivedState;

  const toolbarProps: PropHelpers["toolbarProps"] = {
    className: variant === "compact" ? spacing.pt_0 : "",
    ...(isFilterEnabled && {
      collapseListedFiltersBreakpoint: "xl",
      clearAllFilters: () => setFilterValues({}),
      clearFiltersButtonText: t("actions.clearAllFilters"),
    }),
  };

  const filterToolbarProps = getFilterProps(args);

  const paginationProps = getPaginationProps(args);
  usePaginationEffects(args);

  const paginationToolbarItemProps: PropHelpers["paginationToolbarItemProps"] =
    {
      variant: "pagination",
      align: { default: "alignRight" },
    };

  const toolbarBulkSelectorProps: PropHelpers["toolbarBulkSelectorProps"] = {
    onSelectAll: selectAll,
    areAllSelected,
    selectedRows: selectedItems,
    paginationProps,
    currentPageItems,
    onSelectMultiple: selectMultiple,
  };

  const tableProps: PropHelpers["tableProps"] = {
    variant,
    isExpandable: isExpansionEnabled && !!expandableVariant,
  };

  const getThProps: PropHelpers["getThProps"] = ({ columnKey }) => ({
    ...(isSortEnabled &&
      getSortProps({
        ...args,
        columnKeys,
        columnKey: columnKey as TSortableColumnKey,
      }).th),
    children: columnNames[columnKey],
  });

  const getTrProps: PropHelpers["getTrProps"] = ({ item, onRowClick }) => {
    const activeRowProps = getActiveRowProps({ item, activeRowDerivedState });
    return {
      ...(isActiveRowEnabled && activeRowProps.tr),
      onRowClick: (event) =>
        handlePropagatedRowClick(event, () => {
          activeRowProps.tr.onRowClick?.(event);
          onRowClick?.(event);
        }),
    };
  };

  const getTdProps: PropHelpers["getTdProps"] = ({ columnKey }) => ({
    dataLabel: columnNames[columnKey],
  });

  // TODO move this into a getSelectionProps helper somehow?
  const getSelectCheckboxTdProps: PropHelpers["getSelectCheckboxTdProps"] = ({
    item,
    rowIndex,
  }) => ({
    select: {
      rowIndex,
      onSelect: (_event, isSelecting) => {
        toggleItemSelected(item, isSelecting);
      },
      isSelected: isItemSelected(item),
    },
  });

  // TODO move this into a getExpansionProps helper somehow?
  const getSingleExpandTdProps: PropHelpers["getSingleExpandTdProps"] = ({
    item,
    rowIndex,
  }) => ({
    expand: {
      rowIndex,
      isExpanded: isCellExpanded(item),
      onToggle: () =>
        setCellExpanded({
          item,
          isExpanding: !isCellExpanded(item),
        }),
      expandId: `expandable-row-${item[idProperty]}`,
    },
  });

  // TODO move this into a getExpansionProps helper somehow?
  const getCompoundExpandTdProps: PropHelpers["getCompoundExpandTdProps"] = ({
    item,
    rowIndex,
    columnKey,
  }) => ({
    ...getTdProps({ columnKey }),
    compoundExpand: {
      isExpanded: isCellExpanded(item, columnKey),
      onToggle: () =>
        setCellExpanded({
          item,
          isExpanding: !isCellExpanded(item, columnKey),
          columnKey,
        }),
      expandId: `compound-expand-${item[idProperty]}-${columnKey}`,
      rowIndex,
      columnIndex: columnKeys.indexOf(columnKey),
    },
  });

  // TODO move this into a getExpansionProps helper somehow?
  const getExpandedContentTdProps: PropHelpers["getExpandedContentTdProps"] = ({
    item,
  }) => {
    const expandedColumnKey = expandedCells[String(item[idProperty])];
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
    expansionDerivedState,
    activeRowDerivedState,
    propHelpers: {
      toolbarProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      filterToolbarProps,
      paginationProps,
      paginationToolbarItemProps,
      toolbarBulkSelectorProps,
      getSelectCheckboxTdProps,
      getCompoundExpandTdProps,
      getSingleExpandTdProps,
      getExpandedContentTdProps,
    },
  };
};
