import { type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { Scope } from "@app/api/models";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";

import { useFetchScopes } from "../../../queries/scopes";
import { ManageColumnsToolbar } from "../../applications/applications-table/components/manage-columns-toolbar";

export const ScopesPage: FC = () => {
  const { t } = useTranslation();

  const { scopes, isLoading, fetchError } = useFetchScopes();
  const defaultVerbs = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const usedVerbs = scopes.map((scope) => scope.verb);

  const tableControls = useLocalTableControls({
    tableName: "scopes-table",
    idProperty: "name",
    dataNameProperty: "name",
    items: scopes,
    columnNames: {
      name: "Name",
      resource: "Resource",
      verb: "Verb",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: false,
    hasActionsColumn: false,
    sortableColumns: ["name", "resource", "verb"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (scope) => ({
      name: scope?.name || "",
      resource: scope?.resource || "",
      verb: scope?.verb?.toUpperCase() || "",
    }),
    filterCategories: [
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (scope) => scope?.name || "",
      },
      {
        categoryKey: "resource",
        title: "Resource",
        type: FilterType.search,
        placeholderText: "Filter by resource...",
        getItemValue: (scope) => scope?.resource || "",
      },
      {
        categoryKey: "verb",
        title: "Verb",
        selectOptions: Array.from(
          new Set(
            [...defaultVerbs, ...usedVerbs].map((verb) => verb.toUpperCase())
          )
        )
          .toSorted()
          .map((verb) => ({ value: verb, label: verb })),
        type: FilterType.multiselect,
        placeholderText: t("actions.filterBy", { what: "Verb..." }),
        getItemValue: (scope) => scope?.verb?.toUpperCase() || "",
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
      getColumnVisibility,
    },
    columnState,
  } = tableControls;

  const tooltips: Record<string, ThProps["info"]> = {};

  const toCells = ({ name, resource, verb }: Scope) => ({
    name,
    resource,
    verb,
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("titles.scopes")}</Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar {...filterToolbarProps} />
            <ManageColumnsToolbar
              columns={columnState.columns}
              setColumns={columnState.setColumns}
              defaultColumns={columnState.defaultColumns}
            />
            <ToolbarItem {...paginationToolbarItemProps}>
              <SimplePagination
                idPrefix="scopes-table"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        <Table
          {...tableProps}
          id="scopes-table"
          aria-label={t("titles.scopeTable")}
        >
          <Thead>
            <Tr>
              <TableHeaderContentWithControls {...tableControls}>
                {columnState.columns
                  .filter(({ id }) => getColumnVisibility(id))
                  .map(({ id }) => (
                    <Th
                      key={id}
                      {...getThProps({ columnKey: id })}
                      info={tooltips[id]}
                    />
                  ))}
                <Th screenReaderText={t("actions.rowActions")} />
              </TableHeaderContentWithControls>
            </Tr>
          </Thead>
          <ConditionalTableBody
            isNoData={scopes.length === 0}
            isLoading={isLoading}
            isError={!!fetchError}
            noDataEmptyState={
              <NoDataEmptyState title={t("message.noDataAvailableTitle")} />
            }
            numRenderedColumns={numRenderedColumns}
          >
            <Tbody>
              {currentPageItems
                .map((scope): [Scope, { [p: string]: ReactNode }] => [
                  scope,
                  toCells(scope),
                ])
                .map(([scope, cells], rowIndex) => (
                  <Tr key={scope.name} {...getTrProps({ item: scope })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={scope}
                      rowIndex={rowIndex}
                    >
                      {columnState.columns
                        .filter(({ id }) => getColumnVisibility(id))
                        .map(({ id: columnKey }) => (
                          <Td
                            key={`${columnKey}_${scope.name}`}
                            {...getTdProps({ columnKey })}
                          >
                            {cells[columnKey]}
                          </Td>
                        ))}
                    </TableRowContentWithControls>
                  </Tr>
                ))}
            </Tbody>
          </ConditionalTableBody>
        </Table>
        <SimplePagination
          idPrefix="scopes-table"
          isTop={false}
          paginationProps={paginationProps}
        />
      </PageSection>
    </>
  );
};

export default ScopesPage;
