import * as React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import {
  useTableControlState,
  useTableControlProps,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";

interface GeneratorCollectionItem {
  key: string;
  value: string;
}

export interface GeneratorCollectionTableProps {
  collection?: GeneratorCollectionItem[];
}

const GeneratorCollectionTable: React.FC<GeneratorCollectionTableProps> = ({
  collection,
}) => {
  const { t } = useTranslation();

  const filterCategories = useMemo(
    () => [
      {
        categoryKey: "key",
        title: "Key",
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value: any) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    [t]
  );

  const columnNames = useMemo(
    () => ({
      key: "key",
      value: "value",
    }),
    []
  );

  const tableControlState = useTableControlState({
    tableName: "generator-collection-table",
    persistTo: "state",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.generatorCollections,
    columnNames,
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["key"],
    initialSort: { columnKey: "key", direction: "asc" },
    filterCategories,
    initialItemsPerPage: 10,
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "key",
    currentPageItems: collection || [],
    totalItemCount: (collection || []).length,
    isLoading: false,
  });

  const {
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <Toolbar {...toolbarProps} className={spacing.mtSm}>
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="generator-collection-table"
              isTop
              isCompact
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="Dependency applications table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "key" })} />
              <Th {...getThProps({ columnKey: "value" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={false}
          isError={false}
          isNoData={!collection || collection.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {collection?.map((item, rowIndex) => (
              <Tr key={item.key} {...getTrProps({ item })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={item}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "key" })}>
                    {item.key}
                  </Td>
                  <Td width={70} {...getTdProps({ columnKey: "value" })}>
                    {item.value}
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="generator-collection-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};

GeneratorCollectionTable.displayName = "GeneratorCollectionTable";

export default GeneratorCollectionTable;
