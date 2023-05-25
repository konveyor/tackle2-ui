import * as React from "react";
import { AnalysisIssueReport } from "@app/api/models";
import { getHubRequestParams } from "@app/shared/hooks/table-controls";
import { useFetchFileReports } from "@app/queries/issues";

export interface IIssueAffectedFilesTableProps {
  issueReport: AnalysisIssueReport;
}

export const IssueAffectedFilesTable: React.FC<
  IIssueAffectedFilesTableProps
> = ({ issueReport }) => {
  // TODO useTableControlUrlParams
  // TODO do we need to put these in the URL namespaced/prefixed so they can coexist with the main page table? (yes)
  const {
    result: { data: currentPageFileReports, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchFileReports(issueReport.id, getHubRequestParams({})); // TODO pass params from above

  // TODO useTableControlProps

  // TODO search toolbar at the top

  return <>TODO</>;
};
