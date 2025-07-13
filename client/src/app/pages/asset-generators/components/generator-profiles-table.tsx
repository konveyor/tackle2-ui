import * as React from "react";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Ref } from "@app/api/models";
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

export interface IGeneratorProfilesTable {
  generatorProfiles?: Ref[];
}

const GeneratorProfilesTable: React.FC<IGeneratorProfilesTable> = ({
  generatorProfiles,
}) => {
  const { t } = useTranslation();

  const tableControlState = useTableControlState({
    tableName: "generator-profiles-table",
    persistTo: "state",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.generators,
    columnNames: {
      id: "ID",
      name: "Name",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["name"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: [
      {
        categoryKey: "generator.name",
        title: "Profile Name",
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    initialItemsPerPage: 10,
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: generatorProfiles ?? [],
    totalItemCount: generatorProfiles?.length ?? 0,
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
              idPrefix="generator-profiles-table"
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
              <Th {...getThProps({ columnKey: "id" })} />
              <Th {...getThProps({ columnKey: "name" })} />
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={false}
          isError={false}
          isNoData={true}
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {generatorProfiles?.map((profile, rowIndex) => (
              <Tr key={profile.id} {...getTrProps({ item: profile })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={profile}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "name" })}>
                    {profile.name}
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix="dependency-profiles-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
    </>
  );
};

export default GeneratorProfilesTable;
