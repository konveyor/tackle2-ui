import * as React from "react";
import { useSelectionState } from "@migtools/lib-ui";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { AnalysisIssueReport } from "@app/api/models";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlUrlParams,
} from "@app/shared/hooks/table-controls";
import { useFetchFileReports } from "@app/queries/issues";
import { TableURLParamKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/shared/components/table-controls";
import { SimplePagination } from "@app/shared/components/simple-pagination";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";

export interface IIssueAffectedFilesTableProps {
  issueReport: AnalysisIssueReport | null;
}

export const IssueAffectedFilesTable: React.FC<
  IIssueAffectedFilesTableProps
> = ({ issueReport }) => {
  const tableControlState = useTableControlUrlParams({
    urlParamKeyPrefix: TableURLParamKeyPrefix.affectedFiles,
    columnNames: {
      file: "File",
      incidents: "Incidents",
      effort: "Effort",
    },
    sortableColumns: [
      "file",
      "incidents",
      // "effort" // TODO this doesn't currently work in the hub
    ],
    initialSort: {
      columnKey: "file",
      direction: "asc",
    },
    initialItemsPerPage: 10,
    variant: "compact",
    urlParamsEnabled: !!issueReport,
  });

  const {
    result: { data: currentPageItems, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchFileReports(
    issueReport?.id,
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        file: "file",
        incidents: "incidents",
        // effort: "effort", // TODO this doesn't currently work in the hub
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "file",
    currentPageItems,
    totalItemCount,
    isLoading: isFetching,
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageItems,
      isEqual: (a, b) => a.file === b.file,
    }),
  });

  const {
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

  // TODO search toolbar at the top

  return (
    <>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="affected-files-table"
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <TableComposable {...tableProps} aria-label="Affected files table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "file" })} />
              <Th
                {...getThProps({ columnKey: "incidents" })}
                modifier="nowrap"
              />
              <Th {...getThProps({ columnKey: "effort" })} modifier="nowrap" />
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
            {currentPageItems?.map((issueReport, rowIndex) => (
              <Tr key={issueReport.file}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={issueReport}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "file" })}>
                    TODO: link: {issueReport.file}
                  </Td>
                  <Td
                    width={10}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "incidents" })}
                  >
                    {issueReport.incidents}
                  </Td>
                  <Td
                    width={20}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "effort" })}
                  >
                    TODO: effort
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </TableComposable>
      <SimplePagination
        idPrefix="affected-files-table"
        isTop={false}
        paginationProps={paginationProps}
      />
    </>
  );
};
