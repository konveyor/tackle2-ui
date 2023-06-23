import * as React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PageSection,
  PageSectionVariants,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Paths } from "@app/Paths";
import { AllIssuesTab } from "./all-issues-tab";
import { SingleAppIssuesTab } from "./single-app-issues-tab";

export enum IssueFilterGroups {
  ApplicationInventory = "Application inventory",
  Issues = "Issues",
}

const TAB_PATHS = [Paths.issuesAllTab, Paths.issuesSingleAppTab] as const;

export const Issues: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();

  const activeTabPath = TAB_PATHS.find((path) => location.pathname === path);
  React.useEffect(() => {
    if (!activeTabPath) history.push(Paths.issuesAllTab);
  }, [activeTabPath]);

  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <TextContent>
          <Title headingLevel="h1">{t("terms.issues")}</Title>
          <Text component="small">
            This report provides a concise summary of all issues identified.
          </Text>
        </TextContent>
        <Tabs
          className={spacing.mtSm}
          activeKey={activeTabPath}
          onSelect={(_event, tabPath) => history.push(tabPath as string)}
        >
          <Tab
            eventKey={Paths.issuesAllTab}
            title={<TabTitleText>All issues</TabTitleText>}
          />
          <Tab
            eventKey={Paths.issuesSingleAppTab}
            title={<TabTitleText>Single application</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection>
        {activeTabPath === Paths.issuesAllTab ? (
          <AllIssuesTab />
        ) : activeTabPath === Paths.issuesSingleAppTab ? (
          <SingleAppIssuesTab />
        ) : null}
      </PageSection>
    </>
  );
};
