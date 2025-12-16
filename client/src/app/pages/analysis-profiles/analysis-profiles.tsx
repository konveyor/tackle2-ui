import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Text,
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";

// TODO: Replace with actual AnalysisProfile type from API models
interface AnalysisProfile {
  id: number;
  name: string;
  description?: string;
  createdBy?: string;
  createTime?: string;
}

// TODO: Replace with actual API hook
const useFetchAnalysisProfiles = () => {
  // Placeholder data for initial development
  const profiles: AnalysisProfile[] = [];

  return {
    profiles,
    isFetching: false,
    fetchError: null,
    refetch: () => {},
  };
};

export const AnalysisProfiles: React.FC = () => {
  const { t } = useTranslation();

  const { profiles, isFetching, fetchError } = useFetchAnalysisProfiles();

  const tableControls = useLocalTableControls({
    tableName: "analysis-profiles",
    idProperty: "id",
    dataNameProperty: "name",
    items: profiles,
    columnNames: {
      name: t("terms.name"),
      description: t("terms.description"),
      createdBy: t("terms.createdBy"),
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.name").toLowerCase(),
          }) + "...",
        getItemValue: (profile) => profile?.name ?? "",
      },
    ],
    sortableColumns: ["name", "description", "createdBy"],
    getSortValues: (profile) => ({
      name: profile.name ?? "",
      description: profile.description ?? "",
      createdBy: profile.createdBy ?? "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    isLoading: isFetching,
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
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("titles.analysisProfiles")}</Text>
        </TextContent>
        <TextContent>
          <Text>{t("terms.analysisProfilesDescription")}</Text>
        </TextContent>
      </PageSection>

      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
        >
          <Toolbar
            {...toolbarProps}
            clearAllFilters={() => filterToolbarProps.setFilterValues({})}
          >
            <ToolbarContent>
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button
                    id="create-analysis-profile"
                    variant="primary"
                    onClick={() => {
                      // TODO: Open create modal
                    }}
                  >
                    {t("actions.createNew")}
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="analysis-profiles-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table
            {...tableProps}
            id="analysis-profiles-table"
            aria-label={t("titles.analysisProfiles")}
          >
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} />
                  <Th {...getThProps({ columnKey: "description" })} />
                  <Th {...getThProps({ columnKey: "createdBy" })} />
                </TableHeaderContentWithControls>
              </Tr>
            </Thead>
            <ConditionalTableBody
              isLoading={isFetching}
              isError={!!fetchError}
              isNoData={currentPageItems.length === 0}
              noDataEmptyState={
                <EmptyState variant="sm">
                  <EmptyStateHeader
                    titleText={t("composed.noDataStateTitle", {
                      what: t("terms.analysisProfiles").toLowerCase(),
                    })}
                    headingLevel="h2"
                    icon={<EmptyStateIcon icon={CubesIcon} />}
                  />
                  <EmptyStateBody>
                    {t("composed.noDataStateBody", {
                      how: t("actions.create"),
                      what: t("terms.analysisProfile").toLowerCase(),
                    })}
                  </EmptyStateBody>
                  <EmptyStateFooter>
                    <EmptyStateActions>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // TODO: Open create modal
                        }}
                      >
                        {t("actions.createNew")}
                      </Button>
                    </EmptyStateActions>
                  </EmptyStateFooter>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              <Tbody>
                {currentPageItems.map((profile, rowIndex) => (
                  <Tr key={profile.id} {...getTrProps({ item: profile })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={profile}
                      rowIndex={rowIndex}
                    >
                      <Td width={25} {...getTdProps({ columnKey: "name" })}>
                        {profile.name}
                      </Td>
                      <Td
                        width={50}
                        {...getTdProps({ columnKey: "description" })}
                      >
                        {profile.description || "-"}
                      </Td>
                      <Td
                        width={25}
                        {...getTdProps({ columnKey: "createdBy" })}
                      >
                        {profile.createdBy || "-"}
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                ))}
              </Tbody>
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="analysis-profiles-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </div>
      </PageSection>
    </>
  );
};
