import * as React from "react";
import { AnalysisAppReport, AnalysisIssueReport } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";
import {
  TextContent,
  Text,
  Title,
  Tabs,
  TabTitleText,
  Tab,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { IssueAffectedFilesTable } from "./issue-affected-files-table";

export type IIssueDetailDrawerProps = Pick<
  IPageDrawerContentProps,
  "onCloseClick"
> & {
  applicationName: string | null;
} & (
    | {
        mode: "AppReport";
        report: AnalysisAppReport | null;
      }
    | {
        mode: "IssueReport";
        report: AnalysisIssueReport | null;
      }
  );

enum TabKey {
  AffectedFiles = 0,
}

export const IssueDetailDrawer: React.FC<IIssueDetailDrawerProps> = ({
  mode,
  applicationName,
  report,
  onCloseClick,
}) => {
  const issueRef: { id?: number; name?: string } =
    (mode === "AppReport" ? report?.issue : report) || {};
  const { id: issueId, name: issueName } = issueRef;

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.AffectedFiles
  );

  return (
    <PageDrawerContent
      isExpanded={!!report}
      onCloseClick={onCloseClick}
      focusKey={issueId}
      pageKey="affected-applications"
      drawerPanelContentProps={{ defaultSize: "600px" }}
    >
      <TextContent>
        <Text component="small" className={spacing.mb_0}>
          {applicationName}
        </Text>
        <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
          {issueName}
        </Title>
      </TextContent>
      <Tabs
        activeKey={activeTabKey}
        onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        className={spacing.mtLg}
      >
        <Tab
          eventKey={TabKey.AffectedFiles}
          title={<TabTitleText>Affected files</TabTitleText>}
        >
          {issueId !== undefined && issueName !== undefined ? (
            <IssueAffectedFilesTable issueId={issueId} issueName={issueName} />
          ) : null}
        </Tab>
      </Tabs>
    </PageDrawerContent>
  );
};
