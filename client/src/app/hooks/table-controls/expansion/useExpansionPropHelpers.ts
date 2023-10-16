import { KeyWithValueType } from "@app/utils/type-utils";
import { IExpansionState } from "./useExpansionState";
import { getExpansionDerivedState } from "./getExpansionDerivedState";
import { TdProps } from "@patternfly/react-table";

// Args that should be passed into useTableControlProps
export interface IExpansionPropHelpersExternalArgs<
  TItem,
  TColumnKey extends string,
> {
  columnNames: Record<TColumnKey, string>;
  idProperty: KeyWithValueType<TItem, string | number>;
  expansionState: IExpansionState<TColumnKey>;
}

// Additional args that come from logic inside useTableControlProps
export interface IExpansionPropHelpersInternalArgs<TColumnKey extends string> {
  columnKeys: TColumnKey[];
  numRenderedColumns: number;
}

export const useExpansionPropHelpers = <TItem, TColumnKey extends string>(
  args: IExpansionPropHelpersExternalArgs<TItem, TColumnKey> &
    IExpansionPropHelpersInternalArgs<TColumnKey>
) => {
  const {
    columnNames,
    idProperty,
    columnKeys,
    numRenderedColumns,
    expansionState: { expandedCells },
  } = args;

  const expansionDerivedState = getExpansionDerivedState(args);
  const { isCellExpanded, setCellExpanded } = expansionDerivedState;

  const getSingleExpandButtonTdProps = ({
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
      expandId: `expandable-row-${item[idProperty]}`,
    },
  });

  const getCompoundExpandTdProps = ({
    columnKey,
    item,
    rowIndex,
  }: {
    columnKey: TColumnKey;
    item: TItem;
    rowIndex: number;
  }): Omit<TdProps, "ref"> => ({
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

  const getExpandedContentTdProps = ({
    item,
  }: {
    item: TItem;
  }): Omit<TdProps, "ref"> => {
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
    expansionDerivedState,
    getSingleExpandButtonTdProps,
    getCompoundExpandTdProps,
    getExpandedContentTdProps,
  };
};
