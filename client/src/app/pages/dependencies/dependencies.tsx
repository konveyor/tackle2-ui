import * as React from "react";
import {
  Label,
  LabelGroup,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
  deserializeFilterUrlParams,
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix, UI_UNIQUE_ID } from "@app/Constants";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useFetchDependencies } from "@app/queries/dependencies";
import { DependencyAppsDetailDrawer } from "./dependency-apps-detail-drawer";
import { useSharedAffectedApplicationFilterCategories } from "../issues/helpers";
import { getParsedLabel } from "@app/utils/rules-utils";
import { useHistory } from "react-router-dom";

export const Dependencies: React.FC = () => {
  const { t } = useTranslation();

  const allAffectedApplicationsFilterCategories =
    useSharedAffectedApplicationFilterCategories();

  const urlParams = new URLSearchParams(window.location.search);
  const filters = urlParams.get("filters");
  const deserializedFilterValues = deserializeFilterUrlParams({ filters });

  const tableControlState = useTableControlState({
    tableName: "dependencies-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.dependencies,
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      provider: "Language",
      labels: "Labels",
    },
    initialFilterValues: deserializedFilterValues,
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    sortableColumns: ["name", "foundIn", "labels"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: [
      ...allAffectedApplicationsFilterCategories,
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        filterGroup: "Dependency",
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
      {
        categoryKey: "provider",
        title: t("terms.language"),
        type: FilterType.search,
        filterGroup: "Dependency",
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.language").toLowerCase(),
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchDependencies(
    getHubRequestParams({
      ...tableControlState, // Includes filterState, sortState and paginationState
      hubSortFieldKeys: {
        name: "name",
        foundIn: "applications",
        labels: "labels",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes filterState, sortState and paginationState
    idProperty: UI_UNIQUE_ID,
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
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
    activeItemDerivedState: { activeItem, clearActiveItem },
  } = tableControls;

  const history = useHistory();

  const clearFilters = () => {
    const currentPath = history.location.pathname;
    const newSearch = new URLSearchParams(history.location.search);
    newSearch.delete("filters");
    history.push(`${currentPath}`);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.dependencies")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar {...toolbarProps} clearAllFilters={clearFilters}>
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="dependencies-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table
            {...tableProps}
            id="dependencies-table"
            aria-label="Dependencies table"
          >
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "provider" })} />
                  <Th {...getThProps({ columnKey: "labels" })} />
                  <Th {...getThProps({ columnKey: "foundIn" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={totalItemCount === 0}
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems?.map((dependency, rowIndex) => (
                  <Tr
                    key={dependency.name + rowIndex}
                    {...getTrProps({ item: dependency })}
                  >
                    <TableRowContentWithControls
                      {...tableControls}
                      item={dependency}
                      rowIndex={rowIndex}
                    >
                      <Td width={25} {...getTdProps({ columnKey: "name" })}>
                        {dependency.name}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "provider" })}>
                        {dependency.provider}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "labels" })}>
                        <LabelGroup>
                          {dependency?.labels?.map((label, index) => {
                            const { labelType, labelValue } =
                              getParsedLabel(label);

                            return labelType !== "language" ? (
                              <Label key={`${index}-${labelValue}`}>
                                {labelValue}
                              </Label>
                            ) : undefined;
                          })}
                        </LabelGroup>
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "foundIn" })}>
                        {t("composed.totalApplications", {
                          count: dependency.applications,
                        })}
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="dependencies-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </PageSection>
      <DependencyAppsDetailDrawer
        dependency={activeItem || null}
        onCloseClick={() => clearActiveItem()}
      />
    </>
  );
};
