import * as React from "react";
import { AnalysisIssueReport, Application } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";

export interface IIssueFilesDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  issueReport: AnalysisIssueReport | null;
  application: Application | null;
}

export const IssueFilesDetailDrawer: React.FC<IIssueFilesDetailDrawerProps> = ({
  issueReport,
  application,
  onCloseClick,
}) => {
  return (
    <PageDrawerContent
      isExpanded={!!issueReport && !!application}
      onCloseClick={onCloseClick}
      focusKey={issueReport?.name}
      pageKey="affected-applications"
    >
      TODO details about issue {issueReport?.name} for application{" "}
      {application?.name} here!
    </PageDrawerContent>
  );
};
