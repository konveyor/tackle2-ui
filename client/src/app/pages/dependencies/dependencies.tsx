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
} from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useFetchDependencies } from "@app/queries/dependencies";
import { useSelectionState } from "@migtools/lib-ui";
import { getHubRequestParams } from "@app/shared/hooks/table-controls";
import { PageDrawerContent } from "@app/shared/page-drawer-context";

export const Dependencies: React.FC = () => {
  const { t } = useTranslation();

  const tableControlState = useTableControlUrlParams({
    columnNames: {
      name: "Dependency name",
      foundIn: "Found in",
      version: "Version",
    },
    sortableColumns: ["name", "version"],
    initialSort: null,
    filterCategories: [
      {
        key: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
      },
    ],
    initialItemsPerPage: 10,
    hasClickableRows: true,
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
        version: "version",
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
      getTdProps,
      getClickableTrProps,
    },
    activeRowDerivedState: { activeRowItem, clearActiveRow },
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
                    <Tr {...getClickableTrProps({ item: dependency })}>
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
                          {/* TODO - the applications property disappeared in the API? */}
                          {/*dependency.applications.length} applications*/}
                          TODO
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
      </PageSection>
      <PageDrawerContent
        isExpanded={!!activeRowItem}
        onCloseClick={clearActiveRow}
        focusKey={activeRowItem?.name}
        pageKey="analysis-dependencies"
      >
        TODO details about dependency {activeRowItem?.name} here!
      </PageDrawerContent>
    </>
  );
};
