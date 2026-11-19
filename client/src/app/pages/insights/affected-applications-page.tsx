import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix } from "@app/Constants";
import { Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterToolbar } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { useFetchReportInsightApps } from "@app/queries/analysis";

import {
  getBackToAllInsightsUrl,
  useSharedAffectedApplicationFilterCategories,
} from "./helpers";
import { InsightDetailDrawer } from "./insight-detail-drawer";

export const AffectedApplicationsPage: React.FC = () => {
  const { ruleset, rule } = useParams<"ruleset" | "rule">();
  const { pathname } = useLocation();
  if (ruleset === undefined || rule === undefined) {
    return <Navigate to={Paths.insightsAllTab} replace />;
  }
  try {
    // Validate raw encoding without decoding React Router's params a second time.
    decodeURIComponent(pathname);
  } catch {
    return <Navigate to={Paths.insightsAllTab} replace />;
  }
  if (!ruleset.trim() || !rule.trim()) {
    return <Navigate to={Paths.insightsAllTab} replace />;
  }

  return <AffectedApplicationsContent ruleset={ruleset} rule={rule} />;
};

const AffectedApplicationsContent: React.FC<{
  ruleset: string;
  rule: string;
}> = ({ ruleset, rule }) => {
  const { t } = useTranslation();
  const insightTitle =
    new URLSearchParams(useLocation().search).get("insightTitle") ||
    "Active rule";

  const tableControlState = useTableControlState({
    tableName: "affected-applications-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.insightsAffectedApps,
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business service",
      effort: "Effort",
      incidents: "Incidents",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isActiveItemEnabled: true,
    sortableColumns: ["name", "businessService", "effort", "incidents"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: useSharedAffectedApplicationFilterCategories(),
    initialItemsPerPage: 10,
  });

  const {
    result: { data: currentPageAppReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchReportInsightApps(
    getHubRequestParams({
      ...tableControlState,
      implicitFilters: [
        {
          field: "insight.ruleset",
          operator: "=",
          value: ruleset,
        },
        {
          field: "insight.rule",
          operator: "=",
          value: rule,
        },
      ],
      hubSortFieldKeys: {
        name: "name",
        businessService: "businessService",
        effort: "effort",
        incidents: "incidents",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: currentPageAppReports,
    totalItemCount,
    isLoading: isFetching,
  });

  const {
    numRenderedColumns,
    filterState: { filterValues },
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

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.affectedApplications")}</Content>
        </Content>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to={getBackToAllInsightsUrl({
                fromFilterValues: filterValues,
                fromLocation: useLocation(),
              })}
            >
              {t("terms.insights")}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {insightTitle}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <ConditionalRender
          when={isFetching && !(currentPageAppReports || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor:
                "var(--pf-t--global--background--color--primary--default)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="affected-applications-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <Table {...tableProps} aria-label="Affected applications table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th {...getThProps({ columnKey: "name" })} />
                    <Th {...getThProps({ columnKey: "description" })} />
                    <Th {...getThProps({ columnKey: "businessService" })} />
                    <Th
                      {...getThProps({ columnKey: "effort" })}
                      info={{
                        tooltip: `${t("message.applicationEffortTooltip")}`,
                      }}
                    />
                    <Th {...getThProps({ columnKey: "incidents" })} />
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
                  {currentPageAppReports?.map((appReport, rowIndex) => (
                    <Tr key={appReport.id} {...getTrProps({ item: appReport })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={appReport}
                        rowIndex={rowIndex}
                      >
                        <Td width={20} {...getTdProps({ columnKey: "name" })}>
                          {appReport.name}
                        </Td>
                        <Td
                          width={30}
                          {...getTdProps({ columnKey: "description" })}
                        >
                          {appReport.description}
                        </Td>
                        <Td
                          width={20}
                          {...getTdProps({ columnKey: "businessService" })}
                        >
                          {appReport.businessService}
                        </Td>
                        <Td width={15} {...getTdProps({ columnKey: "effort" })}>
                          {appReport.effort}
                        </Td>
                        <Td
                          width={15}
                          {...getTdProps({ columnKey: "incidents" })}
                        >
                          {appReport.incidents}
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="affected-applications-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <InsightDetailDrawer
        insightId={activeItem?.insight.id || null}
        onCloseClick={clearActiveItem}
      />
    </>
  );
};

export default AffectedApplicationsPage;
