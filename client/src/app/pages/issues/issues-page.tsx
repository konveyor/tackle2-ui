import * as React from "react";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ButtonVariant,
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
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { TablePersistenceKeyPrefix } from "@app/Constants";
import { AllInsightsTable } from "@app/components/insights/tables/all-insights-table";
import {
  useFetchReportAllIssues,
  useFetchReportApplicationIssues,
} from "@app/queries/analysis";
import { SingleApplicationInsightsTable } from "@app/components/insights/tables/single-application-insights-table";
import { IssueDetailDrawer } from "./issue-detail-drawer";
import { UiAnalysisReportApplicationInsight } from "@app/api/models";

export enum IssueFilterGroups {
  ApplicationInventory = "Application inventory",
  Issues = "Issues",
}

export type IssuesTabPath =
  | typeof Paths.issuesAllTab
  | typeof Paths.issuesSingleAppTab;

export const Issues: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const singleAppTabMatch = useRouteMatch(Paths.issuesSingleAppTab);
  const singleAppSelectedMatch = useRouteMatch(Paths.issuesSingleAppSelected);

  const activeTabPath =
    singleAppTabMatch || singleAppSelectedMatch
      ? Paths.issuesSingleAppTab
      : Paths.issuesAllTab;

  React.useEffect(() => {
    if (!activeTabPath) history.push(Paths.issuesAllTab);
  }, [activeTabPath, history]);

  const [navConfirmPath, setNavConfirmPath] =
    React.useState<IssuesTabPath | null>(null);

  const [issueInDetailDrawer, setIssueInDetailDrawer] =
    React.useState<UiAnalysisReportApplicationInsight | null>(null);

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
          onSelect={(_event, tabPath) => {
            const pageHasFilters = new URLSearchParams(location.search).has(
              `${TablePersistenceKeyPrefix.issues}:filters`
            );
            if (pageHasFilters) {
              setNavConfirmPath(tabPath as IssuesTabPath);
            } else {
              history.push(tabPath as IssuesTabPath);
            }
          }}
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
          <AllInsightsTable
            tableName="all-issues-table"
            tableAriaLabel="Issues table"
            affectedAppsPath={Paths.issuesAllAffectedApplications}
            columns={{
              description: "Issue",
              effort: true,
            }}
            useFetchData={useFetchReportAllIssues}
          />
        ) : activeTabPath === Paths.issuesSingleAppTab ? (
          <>
            <SingleApplicationInsightsTable
              tableName="single-application-issues-table"
              tableAriaLabel="Single application issues table"
              pathPattern={Paths.issuesSingleAppSelected}
              keyPrefix={TablePersistenceKeyPrefix.issues}
              columns={{
                description: "Issue",
                effort: true,
              }}
              useFetchData={useFetchReportApplicationIssues}
              onInsightClick={setIssueInDetailDrawer}
            />
            <IssueDetailDrawer
              issueId={issueInDetailDrawer?.id || null}
              onCloseClick={() => setIssueInDetailDrawer(null)}
            />
          </>
        ) : null}
      </PageSection>

      <ConfirmDialog
        isOpen={!!navConfirmPath}
        title={`Navigating to ${
          navConfirmPath === Paths.issuesSingleAppTab
            ? "single application"
            : "all issues"
        }`}
        titleIconVariant="info"
        message={`When navigating to the ${
          navConfirmPath === Paths.issuesSingleAppTab
            ? "single application"
            : "all issues"
        } tab, all filtering settings will be reset.`}
        confirmBtnLabel="Continue"
        cancelBtnLabel="Cancel"
        confirmBtnVariant={ButtonVariant.primary}
        onConfirm={() => {
          history.push(navConfirmPath!);
          setNavConfirmPath(null);
        }}
        onCancel={() => setNavConfirmPath(null)}
        onClose={() => setNavConfirmPath(null)}
      />
    </>
  );
};
