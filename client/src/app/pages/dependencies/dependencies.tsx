import * as React from "react";
import {
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { AppPlaceholder, ConditionalRender } from "@app/shared/components";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import {
  useTableControlUrlParams,
  useTableControlProps,
} from "@app/shared/hooks/use-table-controls";
import { useCompoundExpansionState } from "@app/shared/hooks/useCompoundExpansionState";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { AnalysisDependency } from "@app/api/models";
import { useFetchDependencies } from "@app/queries/dependencies";
import { useSelectionState } from "@migtools/lib-ui";
import { getHubRequestParams } from "@app/utils/hub-request-utils";

export const Dependencies: React.FC = () => {
  const { t } = useTranslation();

  const tableControlState = useTableControlUrlParams({
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      version: "Version",
    },
    sortableColumns: ["name", "version"],
    initialSort: {
      columnKey: "name",
      direction: "asc",
    },
    filterCategories: [
      {
        key: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (item: AnalysisDependency) => {
          return item?.name || "";
        },
      },
    ],
    initialItemsPerPage: 10,
  });
  const { sortState, paginationState } = tableControlState;

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchDependencies(
    getHubRequestParams({
      sortState,
      paginationState,
      hubFieldKeys: {
        name: "name",
        version: "version",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState, // Includes sortState and paginationState
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    filterState: {
      filterValues: {}, // TODO figure out how to wire up filters from HubRequestParams and make them compatible
      setFilterValues: () => {}, // TODO,
      filteredItems: currentPageItems, // TODO this isn't actually needed by useTableControlProps! It's just derived for rendering! Remove it???
    },
    expansionState: useCompoundExpansionState(), // TODO do we want to lift expand/select state to url params too?
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
      getTdProps,
    },
  } = tableControls;

  console.log({ currentPageItems, totalItemCount });

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.dependencies")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(currentPageItems || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-global--BackgroundColor--100)",
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
            <TableComposable {...tableProps} aria-label="Migration waves table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "foundIn" })} />
                    <Th {...getThProps({ columnKey: "version" })} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={totalItemCount === 0}
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((dependency, rowIndex) => {
                  return (
                    <Tbody key={dependency.name}>
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={dependency}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {dependency.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "foundIn" })}
                          >
                            {dependency.applications.length} applications
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "version" })}
                          >
                            {dependency.version}
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                    </Tbody>
                  );
                })}
              </ConditionalTableBody>
            </TableComposable>
            <SimplePagination
              idPrefix="dependencies-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
