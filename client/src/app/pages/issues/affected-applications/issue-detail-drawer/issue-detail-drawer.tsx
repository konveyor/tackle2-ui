import * as React from "react";
import { AnalysisAppReport } from "@app/api/models";
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
  appReport: AnalysisAppReport | null;
}

enum TabKey {
  AffectedFiles = 0,
}

export const IssueDetailDrawer: React.FC<IIssueDetailDrawerProps> = ({
  appReport,
  onCloseClick,
}) => {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.AffectedFiles
  );

  return (
    <PageDrawerContent
      isExpanded={!!appReport}
      onCloseClick={onCloseClick}
      focusKey={appReport?.name}
      pageKey="affected-applications"
      drawerPanelContentProps={{ defaultSize: "600px" }}
    >
      <TextContent>
        <Text component="small" className={spacing.mb_0}>
          {appReport?.name}
        </Text>
        <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
          {appReport?.issue.name}
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
          {appReport ? <IssueAffectedFilesTable appReport={appReport} /> : null}
        </Tab>
      </Tabs>
    </PageDrawerContent>
  );
};
