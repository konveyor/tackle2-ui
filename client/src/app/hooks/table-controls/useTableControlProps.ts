import { useTranslation } from "react-i18next";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { objectKeys } from "@app/utils/utils";
import { ITableControls, IUseTableControlPropsArgs } from "./types";
import { getFilterToolbarProps } from "./filtering";
import { getSortThProps } from "./sorting";
import { getPaginationProps, usePaginationEffects } from "./pagination";
import {
  getActiveRowDerivedState,
  getActiveRowTrProps,
  useActiveRowEffects,
} from "./active-row";
import { handlePropagatedRowClick } from "./utils";
import { getExpansionDerivedState, getExpansionPropHelpers } from "./expansion";

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
  const {
    getSingleExpandButtonTdProps,
    getCompoundExpandTdProps,
    getExpandedContentTdProps,
  } = getExpansionPropHelpers({
    ...args,
    columnKeys,
    numRenderedColumns,
    expansionDerivedState,
  });

  const activeRowDerivedState = getActiveRowDerivedState(args);
  useActiveRowEffects({ ...args, activeRowDerivedState });

  const toolbarProps: PropHelpers["toolbarProps"] = {
    className: variant === "compact" ? spacing.pt_0 : "",
    ...(isFilterEnabled && {
      collapseListedFiltersBreakpoint: "xl",
      clearAllFilters: () => setFilterValues({}),
      clearFiltersButtonText: t("actions.clearAllFilters"),
    }),
  };

  const filterToolbarProps = getFilterToolbarProps(args);

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
      getSortThProps({
        ...args,
        columnKeys,
        columnKey: columnKey as TSortableColumnKey,
      })),
    children: columnNames[columnKey],
  });

  const getTrProps: PropHelpers["getTrProps"] = ({ item, onRowClick }) => {
    const activeRowTrProps = getActiveRowTrProps({
      item,
      activeRowDerivedState,
    });
    return {
      ...(isActiveRowEnabled && activeRowTrProps),
      onRowClick: (event) =>
        handlePropagatedRowClick(event, () => {
          activeRowTrProps.onRowClick?.(event);
          onRowClick?.(event);
        }),
    };
  };

  const getTdProps: PropHelpers["getTdProps"] = (args) => {
    const { columnKey } = args;
    return {
      dataLabel: columnNames[columnKey],
      ...(isExpansionEnabled &&
        expandableVariant === "compound" &&
        args.isCompoundExpandToggle &&
        getCompoundExpandTdProps({
          columnKey,
          item: args.item,
          rowIndex: args.rowIndex,
        })),
    };
  };

  // TODO move this into a getSelectionProps helper and make it part of getTdProps once we move selection from lib-ui
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
      getSingleExpandButtonTdProps,
      getExpandedContentTdProps,
    },
  };
};
