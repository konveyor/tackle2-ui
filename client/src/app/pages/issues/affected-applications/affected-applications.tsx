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
  getHubRequestParams,
  useTableControlProps,
} from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useFetchIssueReports } from "@app/queries/issues";
import { useFetchApplications } from "@app/queries/applications";
import { Link, useLocation, useParams } from "react-router-dom";
import { IssueFilterGroups } from "../issues";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useSelectionState } from "@migtools/lib-ui";
import { getBackToIssuesUrl } from "../helpers";
import { IssueDetailDrawer } from "./issue-detail-drawer";
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
    urlParamKeyPrefix: TableURLParamKeyPrefix.affectedApps,
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business serice",
      tags: "Tags",
    },
    // TODO this isn't working in the hub
    // sortableColumns: ["name"],
    // initialSort: {
    //   columnKey: "name",
    //   direction: "asc",
    // },
    filterCategories: [
      //TODO: Should this be select filter type using apps available in memory?
      {
        key: "application.name",
        title: t("terms.applicationName"),
        filterGroup: IssueFilterGroups.ApplicationInventory,
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: t("terms.applicationName").toLowerCase(),
          }) + "...",
      },
    ],
    initialItemsPerPage: 10,
    hasClickableRows: true,
  });

  const {
    result: { data: currentPageIssueReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchIssueReports(
    getHubRequestParams({
      ...tableControlState,
      implicitFilters: [
        {
          field: "ruleset",
          operator: "=",
          value: ruleset || "",
        },
        {
          field: "rule",
          operator: "=",
          value: rule || "",
        },
      ],
      /*
      // TODO this isn't working in the hub
      hubSortFieldKeys: {
        name: "application.name",
      },*/
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "id",
    currentPageItems: currentPageIssueReports,
    totalItemCount,
    isLoading: isFetching,
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageIssueReports,
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

  const { data: applications } = useFetchApplications();

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{t("terms.affectedApplications")}</Text>
        </TextContent>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to={getBackToIssuesUrl({
                fromFilterValues: filterValues,
                fromLocation: useLocation(),
              })}
            >
              {t("terms.issues")}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {ruleReportName} ({ruleset}, {rule})
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isFetching && !(currentPageIssueReports || fetchError)}
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
                    idPrefix="affected-applications-table"
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
                    <Th {...getThProps({ columnKey: "description" })} />
                    <Th {...getThProps({ columnKey: "businessService" })} />
                    <Th {...getThProps({ columnKey: "tags" })} />
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
                  {currentPageIssueReports?.map((issueReport, rowIndex) => {
                    const application = applications.find(
                      (app) => app.id === issueReport.application.id
                    );
                    if (!application) return null;
                    return (
                      <Tr
                        key={application.name}
                        {...getClickableTrProps({ item: issueReport })}
                      >
                        <TableRowContentWithControls
                          {...tableControls}
                          item={issueReport}
                          rowIndex={rowIndex}
                        >
                          <Td width={25} {...getTdProps({ columnKey: "name" })}>
                            {application.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "description" })}
                          >
                            {application.description}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({ columnKey: "businessService" })}
                          >
                            {application.businessService?.name}
                          </Td>
                          <Td
                            width={10}
                            {...getTdProps({
                              columnKey: "tags",
                            })}
                          >
                            {application?.tags?.length}
                          </Td>
                        </TableRowContentWithControls>
                      </Tr>
                    );
                  })}
                </Tbody>
              </ConditionalTableBody>
            </TableComposable>
            <SimplePagination
              idPrefix="affected-applications-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>
      </PageSection>
      <IssueDetailDrawer
        issueReport={activeRowItem}
        onCloseClick={clearActiveRow}
      />
    </>
  );
};
