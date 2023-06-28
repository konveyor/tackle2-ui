import * as React from "react";
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
import { useFetchIssue } from "@app/queries/issues";
import { AppPlaceholder } from "@app/shared/components";
import { StateNoData } from "@app/shared/components/app-table/state-no-data";

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
    >
      {isFetching ? (
        <AppPlaceholder />
      ) : !issue ? (
        <StateNoData />
      ) : (
        <>
          <TextContent>
            <Text component="small" className={spacing.mb_0}>
              {applicationName}
            </Text>
            <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
              {issue.name}
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
              <IssueAffectedFilesTable issue={issue} />
            </Tab>
          </Tabs>
        </>
      )}
    </PageDrawerContent>
  );
};
