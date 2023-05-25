import * as React from "react";
import { AnalysisIssueReport } from "@app/api/models";
import { useLocalTableControls } from "@app/shared/hooks/table-controls";

export interface IIssueAffectedFilesTableProps {
  issueReport: AnalysisIssueReport;
}

export const IssueAffectedFilesTable: React.FC<
  IIssueAffectedFilesTableProps
> = ({ issueReport }) => {
  // TODO load files!

  // TODO do we want to be able to put these in the URL, namespaced so they can coexist with the main page table?
  // TODO should we just do that by defualt for anywhere we're using useLocalTableControls?
  /*
  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: [], // TODO files
    // TODO
  });
  */

  return <>TODO</>;
};
