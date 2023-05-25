import * as React from "react";
import { AnalysisIssueReport, Application } from "@app/api/models";
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

export interface IIssueDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  issueReport: AnalysisIssueReport | null;
  application: Application | null;
}

enum TabKey {
  AffectedFiles = 0,
}

export const IssueDetailDrawer: React.FC<IIssueDetailDrawerProps> = ({
  issueReport,
  application,
  onCloseClick,
}) => {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.AffectedFiles
  );

  // TODO should we also show the application name at the top?
  return (
    <PageDrawerContent
      isExpanded={!!issueReport && !!application}
      onCloseClick={onCloseClick}
      focusKey={issueReport?.name}
      pageKey="affected-applications"
    >
      <TextContent>
        <Text component="small" className={spacing.mb_0}>
          {application?.name}
        </Text>
        <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
          {issueReport?.name}
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
          {issueReport ? (
            <>
              TODO: Toolbar here
              <IssueAffectedFilesTable issueReport={issueReport} />
            </>
          ) : null}
        </Tab>
      </Tabs>
    </PageDrawerContent>
  );
};
