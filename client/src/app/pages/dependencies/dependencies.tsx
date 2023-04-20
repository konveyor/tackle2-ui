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
  useTableControlProps,
  useTableControls,
} from "@app/shared/hooks/use-table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useFetchDependencies } from "@app/queries/dependencies";
import { useTableControlUrlParams } from "@app/shared/hooks/use-table-controls/useTableControlURLParams";

export const Dependencies: React.FC = () => {
  const { t } = useTranslation();

  const { hubRequestParams, setFilters, setSort, setPagination } =
    useTableControlUrlParams({
      defaultParams: {
        page: { pageNum: 1, itemsPerPage: 10 },
        sort: { field: "name", direction: "asc" },
      },
    });

  const {
    result: { data: dependencies, total },
    isFetching,
    fetchError,
  } = useFetchDependencies(hubRequestParams);

  // TODO adjust the below to what we really need
  const tableControls = useTableControlProps({
    items: dependencies, // TODO rename to currentPageItems?
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      version: "Version",
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
        getItemValue: (item) => {
          return item?.name || "";
        },
      },
    ],
    sortableColumns: ["name", "foundIn", "version"],
    // TODO getServerSortKeys / getHubSortFields / whatever?
    hasPagination: true,
  });

  /* const tableControls = useTableControls({
    items: dependencies,
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      version: "Version",
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
        getItemValue: (item) => {
          return item?.name || "";
        },
      },
    ],
    sortableColumns: ["name", "foundIn", "version"],
    // TODO replace with something like getServerSortKeys?
    getSortValues: (dependency) => ({
      name: dependency.name || "",
      foundIn: "", // TODO
      version: dependency.version || "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    hasPagination: true,
  });
  const {
    numRenderedColumns,
    paginationState: { currentPageItems },
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
  */

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.migrationWaves")}</Text>
        </TextContent>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(dependencies || fetchError)}
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
                isNoData={dependencies.length === 0}
                numRenderedColumns={numRenderedColumns}
              >
                {currentPageItems?.map((dependency, rowIndex) => {
                  return (
                    <Tbody key={dependency.id}>
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
