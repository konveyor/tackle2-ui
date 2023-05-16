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
} from "@app/shared/hooks/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { useFetchIssues } from "@app/queries/issues";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";
import { useFetchApplications } from "@app/queries/applications";
import { Application } from "@app/api/models";
import { Link, useParams } from "react-router-dom";
interface IAffectedApplicationsRouteParams {
  ruleidparam: string;
}

export const AffectedApplications: React.FC = () => {
  const { t } = useTranslation();

  const { ruleidparam } = useParams<IAffectedApplicationsRouteParams>();

  const tableControlState = useTableControlUrlParams({
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business serice",
      tags: "Tags",
    },
    sortableColumns: ["name"],
    initialSort: {
      columnKey: "name",
      direction: "asc",
    },
    initialItemsPerPage: 10,
  });

  const {
    result: { data: issues, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchIssues(
    getHubRequestParams({
      filterState: {
        filterValues: {
          ruleid: [ruleidparam || ""],
        },
        setFilterValues: tableControlState.filterState.setFilterValues,
      },
    })
  );

  const { data: applications } = useFetchApplications();
  const issueAppIds = issues.map((issue) => issue.application);
  const affectedApplications: Application[] = applications.filter(
    (app) => app.id && issueAppIds.includes(app.id)
  );

  const tableControls = useLocalTableControls({
    idProperty: "name",
    items: applications,
    columnNames: {
      name: "Name",
      description: "Description",
      businessService: "Business serice",
      tags: "Tags",
    },
    sortableColumns: ["name"],
    getSortValues: (item) => ({
      name: item?.name || "",
    }),
    initialSort: { columnKey: "name", direction: "asc" },
    hasPagination: true,
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
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
          <Text component="h1">{t("terms.issues")}</Text>
        </TextContent>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/composite/issues">Issues</Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {ruleidparam || "Active rule"}
          </BreadcrumbItem>
        </Breadcrumb>
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
                {affectedApplications?.map((application, rowIndex) => {
                  return (
                    <Tbody key={application.name}>
                      <Tr>
                        <TableRowContentWithControls
                          {...tableControls}
                          item={application}
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
