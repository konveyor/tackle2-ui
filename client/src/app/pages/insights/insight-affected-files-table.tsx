import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { TablePersistenceKeyPrefix, UI_UNIQUE_ID } from "@app/Constants";
import { AnalysisInsight, AnalysisReportFile, WithUiId } from "@app/api/models";
import { BreakingPathDisplay } from "@app/components/BreakingPathDisplay";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
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
import { useFetchReportInsightFiles } from "@app/queries/analysis";

import { FileIncidentsDetailModal } from "./file-incidents-detail-modal";

export interface IInsightAffectedFilesTableProps {
  insight: AnalysisInsight;
}

export const InsightAffectedFilesTable: React.FC<
  IInsightAffectedFilesTableProps
> = ({ insight }) => {
  const { t } = useTranslation();

  const tableControlState = useTableControlState({
    tableName: "affected-files-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.insightsAffectedFiles,
    columnNames: {
      file: "File",
      incidents: "Incidents",
      effort: "Effort",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    sortableColumns: ["file", "incidents", "effort"],
    initialSort: { columnKey: "file", direction: "asc" },
    filterCategories: [
      {
        categoryKey: "file",
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
  });

  const {
    result: { data: currentPageFileReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchReportInsightFiles(
    insight.id,
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        file: "file",
        incidents: "incidents",
        effort: "effort",
      },
    })
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: UI_UNIQUE_ID,
    currentPageItems: currentPageFileReports,
    totalItemCount,
    isLoading: isFetching,
    variant: "compact",
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
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  const [selectedFileForDetailModal, setSelectedFileForDetailModal] =
    React.useState<WithUiId<AnalysisReportFile> | null>(null);

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
      <Table {...tableProps} aria-label="Affected files table">
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "file" })} />
              <Th
                {...getThProps({ columnKey: "incidents" })}
                modifier="nowrap"
              />
              <Th
                {...getThProps({ columnKey: "effort" })}
                width={10}
                info={{
                  tooltip: `${t("message.affectedAppEffortTooltip")}`,
                }}
                modifier="nowrap"
              />
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
              <Tr
                key={fileReport[UI_UNIQUE_ID]}
                {...getTrProps({ item: fileReport })}
              >
                <TableRowContentWithControls
                  {...tableControls}
                  item={fileReport}
                  rowIndex={rowIndex}
                >
                  <Td {...getTdProps({ columnKey: "file" })}>
                    <Button
                      variant="link"
                      isInline
                      onClick={() => setSelectedFileForDetailModal(fileReport)}
                    >
                      <BreakingPathDisplay
                        path={fileReport?.file || "<unknown>"}
                      />
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
      </Table>
      <SimplePagination
        idPrefix="affected-files-table"
        isTop={false}
        isCompact
        paginationProps={paginationProps}
      />
      {selectedFileForDetailModal ? (
        <FileIncidentsDetailModal
          insight={insight}
          fileReport={selectedFileForDetailModal}
          onClose={() => setSelectedFileForDetailModal(null)}
        />
      ) : null}
    </>
  );
};
