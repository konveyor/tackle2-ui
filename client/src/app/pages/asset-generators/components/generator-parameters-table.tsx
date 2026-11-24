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

import { GeneratorParameter } from "../utils";

interface GeneratorParametersTableProps {
  parameters?: GeneratorParameter[];
}

const GeneratorParametersTable: React.FC<GeneratorParametersTableProps> = ({
  parameters,
}) => {
  const { t } = useTranslation();

  const rows = (parameters ?? []).map((p) => ({
    name: p.name,
    default: p.default == null ? "" : String(p.default),
  }));

  const tableControls = useLocalTableControls({
    tableName: "generator-parameters-table",
    idProperty: "name",
    dataNameProperty: "name",
    items: rows,
    columnNames: {
      name: t("terms.name"),
      default: t("terms.defaultValue"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name", "default"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: ({ name, default: defaultValue }) => ({
      name: name ?? "",
      default: defaultValue ?? "",
    }),
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", { what: t("terms.name").toLowerCase() }) +
          "...",
        getItemValue: ({ name }) => name ?? "",
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
              idPrefix="generator-parameters-table"
              isTop
              isCompact
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table {...tableProps} aria-label="Asset generator parameters table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "name" })} />
              <Th {...getThProps({ columnKey: "default" })} />
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
              <Tr key={item.name} {...getTrProps({ item })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={item}
                  rowIndex={rowIndex}
                >
                  <Td width={50} {...getTdProps({ columnKey: "name" })}>
                    {item.name}
                  </Td>
                  <Td width={50} {...getTdProps({ columnKey: "default" })}>
                    {item.default}
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="generator-parameters-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};

GeneratorParametersTable.displayName = "GeneratorParametersTable";

export default GeneratorParametersTable;
