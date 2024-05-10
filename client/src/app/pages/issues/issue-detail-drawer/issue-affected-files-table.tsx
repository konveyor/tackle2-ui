import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Flex,
  FlexItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useSelectionState } from "@migtools/lib-ui";
import { AnalysisFileReport, AnalysisIssue } from "@app/api/models";
import {
  useTableControlState,
  useTableControlProps,
  getHubRequestParams,
} from "@app/hooks/table-controls";
import { useFetchFileReports } from "@app/queries/issues";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { SimplePagination } from "@app/components/SimplePagination";
import { FileIncidentsDetailModal } from "./file-incidents-detail-modal";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import PathDisplay from "./path-display";
import { QuestionCircleIcon } from "@patternfly/react-icons";

export interface IIssueAffectedFilesTableProps {
  issue: AnalysisIssue;
}

export const IssueAffectedFilesTable: React.FC<
  IIssueAffectedFilesTableProps
> = ({ issue }) => {
  const { t } = useTranslation();

  const tableControlState = useTableControlState({
    tableName: "affected-files-table",
    persistTo: "urlParams",
    persistenceKeyPrefix: TablePersistenceKeyPrefix.issuesAffectedFiles,
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
  } = useFetchFileReports(
    issue.id,
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
    idProperty: "file",
    currentPageItems: currentPageFileReports,
    totalItemCount,
    isLoading: isFetching,
    variant: "compact",
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
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  const [selectedFileForDetailModal, setSelectedFileForDetailModal] =
    React.useState<AnalysisFileReport | null>(null);

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
              <Th {...getThProps({ columnKey: "effort" })}>
                <Flex
                  flexWrap={{ default: "nowrap" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>{t("terms.effort")}</FlexItem>
                  <FlexItem>
                    <Tooltip
                      content={t("message.affectedAppEffortTooltip")}
                      position="top"
                    >
                      <Flex>
                        <QuestionCircleIcon />
                      </Flex>
                    </Tooltip>
                  </FlexItem>
                </Flex>
              </Th>
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
              <Tr key={fileReport.file} {...getTrProps({ item: fileReport })}>
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
                      <PathDisplay path={fileReport?.file || "<unknown>"} />
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
          issue={issue}
          fileReport={selectedFileForDetailModal}
          onClose={() => setSelectedFileForDetailModal(null)}
        />
      ) : null}
    </>
  );
};
