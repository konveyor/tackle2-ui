import * as React from "react";
import { AnalysisIssue, Application } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";

export interface IIssueFilesDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  issue: AnalysisIssue | null;
  application: Application | null;
}

export const IssueFilesDetailDrawer: React.FC<IIssueFilesDetailDrawerProps> = ({
  issue,
  application,
  onCloseClick,
}) => {
  return (
    <PageDrawerContent
      isExpanded={!!issue && !!application}
      onCloseClick={onCloseClick}
      focusKey={issue?.name}
      pageKey="affected-applications"
    >
      TODO details about issue {issue?.name} for application {application?.name}{" "}
      here!
    </PageDrawerContent>
  );
};
