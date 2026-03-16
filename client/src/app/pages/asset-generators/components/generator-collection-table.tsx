import * as React from "react";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";

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

  const tableControls = useLocalTableControls({
    tableName: "generator-collection-table",
    idProperty: "key",
    dataNameProperty: "key",
    items: collection || [],
    columnNames: {
      key: "Key",
      value: "Value",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["key", "value"],
    initialSort: { columnKey: "key", direction: "asc" },
    getSortValues: ({ key, value }) => ({
      key: key ?? "",
      value: value ?? "",
    }),
    filterCategories: [
      {
        categoryKey: "key",
        title: "Key",
        type: FilterType.search,
        placeholderText: t("actions.filterBy", { what: "key" }) + "...",
        getItemValue: ({ key }) => key ?? "",
      },
      {
        categoryKey: "value",
        title: "Value",
        type: FilterType.search,
        placeholderText: t("actions.filterBy", { what: "value" }) + "...",
        getItemValue: ({ value }) => value ?? "",
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    currentPageItems,
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
      <Table {...tableProps} aria-label="Asset generator collections table">
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
          isNoData={currentPageItems.length === 0}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems.map((item, rowIndex) => (
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
