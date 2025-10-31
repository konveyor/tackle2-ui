import * as React from "react";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
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
import { useFetchIssue } from "@app/queries/issues";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { StateNoData } from "@app/components/StateNoData";
import { getIssueTitle } from "../helpers";

export interface IIssueDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  issueId: number | null;
  applicationName: string | null;
}

enum TabKey {
  AffectedFiles = 0,
}

export const IssueDetailDrawer: React.FC<IIssueDetailDrawerProps> = ({
  issueId,
  applicationName,
  onCloseClick,
}) => {
  const {
    result: { data: issue },
    isFetching,
  } = useFetchIssue(issueId || undefined);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.AffectedFiles
  );

  return (
    <PageDrawerContent
      isExpanded={issueId !== null}
      onCloseClick={onCloseClick}
      focusKey={issueId || ""}
      pageKey="affected-applications"
      drawerPanelContentProps={{ defaultSize: "600px" }}
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            Issue
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {issue ? getIssueTitle(issue) : ""}
          </Title>
        </TextContent>
      }
    >
      {isFetching ? (
        <AppPlaceholder />
      ) : !issue ? (
        <StateNoData />
      ) : (
        <div>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
            className={spacing.mtLg}
          >
            <Tab
              eventKey={TabKey.AffectedFiles}
              title={<TabTitleText>Affected files</TabTitleText>}
            >
              <IssueAffectedFilesTable issue={issue} />
            </Tab>
          </Tabs>
        </div>
      )}
    </PageDrawerContent>
  );
};
