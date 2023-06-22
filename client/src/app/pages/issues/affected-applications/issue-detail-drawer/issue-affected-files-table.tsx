import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useSelectionState } from "@migtools/lib-ui";
import { AnalysisFileReport, AnalysisAppReport } from "@app/api/models";
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
import { FileIncidentsDetailModal } from "./file-incidents-detail-modal";
import {
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";

export interface IIssueAffectedFilesTableProps {
  appReport: AnalysisAppReport;
}

export const IssueAffectedFilesTable: React.FC<
  IIssueAffectedFilesTableProps
> = ({ appReport }) => {
  const { t } = useTranslation();

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
      // "effort", // TODO this sort is not supported by the hub yet
    ],
    initialSort: { columnKey: "file", direction: "asc" },
    filterCategories: [
      {
        key: "file",
        title: "File",
        type: FilterType.search,
        placeholderText:
          t("actions.filterBy", {
            what: "file", // TODO i18n
          }) + "...",
        getServerFilterValue: (value) => (value ? [`*${value[0]}*`] : []),
      },
    ],
    initialItemsPerPage: 10,
    variant: "compact",
  });

  const {
    result: { data: currentPageFileReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchFileReports(
    appReport.issue.id,
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        file: "file",
        incidents: "incidents",
        // effort: "effort", // TODO this sort is not supported by the hub yet
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "file",
    currentPageItems: currentPageFileReports,
    totalItemCount,
    isLoading: isFetching,
    // TODO FIXME - we don't need selectionState but it's required by this hook?
    selectionState: useSelectionState({
      items: currentPageFileReports,
      isEqual: (a, b) => a.file === b.file,
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

  const [selectedFileForDetailModal, setSelectedFileForDetailModal] =
    React.useState<AnalysisFileReport | null>(null);

  // TODO search toolbar at the top

  return (
    <>
      <Toolbar {...toolbarProps} className={spacing.mtSm}>
        <ToolbarContent>
          <FilterToolbar {...filterToolbarProps} showFiltersSideBySide />
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix="affected-files-table"
              isTop
              isCompact
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
            {currentPageFileReports?.map((fileReport, rowIndex) => (
              <Tr key={fileReport.file}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={fileReport}
                  rowIndex={rowIndex}
                >
                  <Td width={70} {...getTdProps({ columnKey: "file" })}>
                    <Button
                      variant="link"
                      isInline
                      onClick={() => setSelectedFileForDetailModal(fileReport)}
                    >
                      {fileReport.file}
                    </Button>
                  </Td>
                  <Td
                    width={10}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "incidents" })}
                  >
                    {fileReport.incidents}
                  </Td>
                  <Td
                    width={20}
                    modifier="nowrap"
                    {...getTdProps({ columnKey: "effort" })}
                  >
                    {fileReport.effort}
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
        isCompact
        paginationProps={paginationProps}
      />
      {selectedFileForDetailModal ? (
        <FileIncidentsDetailModal
          appReport={appReport}
          fileReport={selectedFileForDetailModal}
          onClose={() => setSelectedFileForDetailModal(null)}
        />
      ) : null}
    </>
  );
};
