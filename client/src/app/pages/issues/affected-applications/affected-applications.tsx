import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  useTableControlUrlParams,
  getHubRequestParams,
  useTableControlProps,
} from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useFetchAppReports } from "@app/queries/issues";
import { Link, useLocation, useParams } from "react-router-dom";
import { FilterToolbar } from "@app/shared/components/FilterToolbar";
import { useSelectionState } from "@migtools/lib-ui";
import {
  getBackToAllIssuesUrl,
  useSharedAffectedApplicationFilterCategories,
} from "../helpers";
import { IssueDetailDrawer } from "../issue-detail-drawer";
import { TableURLParamKeyPrefix } from "@app/Constants";

interface IAffectedApplicationsRouteParams {
  ruleset: string;
  rule: string;
}

export const AffectedApplications: React.FC = () => {
  const { t } = useTranslation();

  const { ruleset, rule } = useParams<IAffectedApplicationsRouteParams>();
  const ruleReportName =
    new URLSearchParams(useLocation().search).get("ruleReportName") ||
    "Active rule";

  const tableControlState = useTableControlUrlParams({
    urlParamKeyPrefix: TableURLParamKeyPrefix.issuesAffectedApps,
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business serice",
      effort: "Effort",
      incidents: "Incidents",
    },
    sortableColumns: ["name", "businessService", "effort", "incidents"],
    initialSort: { columnKey: "name", direction: "asc" },
    filterCategories: useSharedAffectedApplicationFilterCategories(),
    initialItemsPerPage: 10,
    // TODO PF V5 obsolete
    // hasClickableRows: true,
  });

  const {
    result: { data: currentPageAppReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchAppReports(
    getHubRequestParams({
      ...tableControlState,
      implicitFilters: [
        {
          field: "issue.ruleset",
          operator: "=",
          value: ruleset || "",
        },
        {
          field: "issue.rule",
          operator: "=",
          value: rule || "",
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
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageAppReports,
      isEqual: (a, b) => a.id === b.id,
    }),
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
      getTdProps,
      getClickableTrProps,
    },
    activeRowDerivedState: { activeRowItem, clearActiveRow },
  } = tableControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.affectedApplications")}</Text>
        </TextContent>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to={getBackToAllIssuesUrl({
                fromFilterValues: filterValues,
                fromLocation: useLocation(),
              })}
            >
              {t("terms.issues")}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {ruleReportName}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(currentPageAppReports || fetchError)}
          then={<AppPlaceholder />}
        >
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
                    idPrefix="affected-applications-table"
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
                    <Th {...getThProps({ columnKey: "description" })} />
                    <Th {...getThProps({ columnKey: "businessService" })} />
                    <Th {...getThProps({ columnKey: "effort" })} />
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
                    <Tr
                      key={appReport.id}
                      {...getClickableTrProps({ item: appReport })}
                    >
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
      <IssueDetailDrawer
        issueId={activeRowItem?.issue.id || null}
        applicationName={activeRowItem?.name || null}
        onCloseClick={clearActiveRow}
      />
    </>
  );
};
