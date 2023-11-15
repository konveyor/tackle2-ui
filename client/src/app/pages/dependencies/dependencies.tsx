import * as React from "react";
import {
  Button,
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
} from "@app/hooks/table-controls";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useFetchDependencies } from "@app/queries/dependencies";
import { useSelectionState } from "@migtools/lib-ui";
import { DependencyAppsDetailDrawer } from "./dependency-apps-detail-drawer";
import { useSharedAffectedApplicationFilterCategories } from "../issues/helpers";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { getParsedLabel } from "@app/utils/rules-utils";

export const Dependencies: React.FC = () => {
  const { t } = useTranslation();

  const allAffectedApplicationsFilterCategories =
    useSharedAffectedApplicationFilterCategories();

  const tableControlState = useTableControlState({
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.dependencies,
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      provider: "Language",
      labels: "Labels",
      sha: "SHA",
      version: "Version",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    sortableColumns: ["name", "foundIn", "labels"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: [
      ...allAffectedApplicationsFilterCategories,
      {
        key: "name",
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
        key: "provider",
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
    idProperty: "name",
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    selectionState: useSelectionState({
      items: currentPageItems,
      isEqual: (a, b) => a.name === b.name,
    }),
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
    activeItemDerivedState: { activeItem, clearActiveItem, setActiveItem },
  } = tableControls;

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
          <Toolbar {...toolbarProps}>
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
          <Table {...tableProps} aria-label="Migration waves table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "foundIn" })} />
                  <Th {...getThProps({ columnKey: "provider" })} />
                  <Th {...getThProps({ columnKey: "labels" })} />
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
                      <Td width={10} {...getTdProps({ columnKey: "foundIn" })}>
                        <Button
                          className={spacing.pl_0}
                          variant="link"
                          onClick={(_) => {
                            if (activeItem && activeItem === dependency) {
                              clearActiveItem();
                            } else {
                              setActiveItem(dependency);
                            }
                          }}
                        >
                          {`${dependency.applications} application(s)`}
                        </Button>
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "provider" })}>
                        {dependency.provider}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "labels" })}>
                        <LabelGroup>
                          {dependency?.labels?.map((label) => {
                            if (getParsedLabel(label).labelType !== "language")
                              return (
                                <Label>
                                  {getParsedLabel(label).labelValue}
                                </Label>
                              );
                          })}
                        </LabelGroup>
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
        onCloseClick={() => setActiveItem(null)}
      />
    </>
  );
};
