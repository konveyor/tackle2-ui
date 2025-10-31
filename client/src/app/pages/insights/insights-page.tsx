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
  useFetchReportAllInsights,
  useFetchReportApplicationInsights,
} from "@app/queries/analysis";
import { SingleApplicationInsightsTable } from "@app/components/insights/tables/single-application-insights-table";
import { InsightDetailDrawer } from "./insight-detail-drawer";
import { UiAnalysisReportApplicationInsight } from "@app/api/models";

export type InsightsTabPath =
  | typeof Paths.insightsAllTab
  | typeof Paths.insightsSingleAppTab;

export const InsightsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const singleAppTabMatch = useRouteMatch(Paths.insightsSingleAppTab);
  const singleAppSelectedMatch = useRouteMatch(Paths.insightsSingleAppSelected);

  const activeTabPath =
    singleAppTabMatch || singleAppSelectedMatch
      ? Paths.insightsSingleAppTab
      : Paths.insightsAllTab;

  const [navConfirmPath, setNavConfirmPath] =
    React.useState<InsightsTabPath | null>(null);

  const [insightInDetailDrawer, setInsightInDetailDrawer] =
    React.useState<UiAnalysisReportApplicationInsight | null>(null);

  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <TextContent>
          <Title headingLevel="h1">{t("terms.insights")}</Title>
          <Text component="small">
            This report provides a concise summary of all insights identified.
          </Text>
        </TextContent>
        <Tabs
          className={spacing.mtSm}
          activeKey={activeTabPath}
          onSelect={(_event, tabPath) => {
            const pageHasFilters = new URLSearchParams(location.search).has(
              `${TablePersistenceKeyPrefix.insights}:filters`
            );
            if (pageHasFilters) {
              setNavConfirmPath(tabPath as InsightsTabPath);
            } else {
              history.push(tabPath as InsightsTabPath);
            }
          }}
        >
          <Tab
            eventKey={Paths.insightsAllTab}
            title={<TabTitleText>All insights</TabTitleText>}
          />
          <Tab
            eventKey={Paths.insightsSingleAppTab}
            title={<TabTitleText>Single application</TabTitleText>}
          />
        </Tabs>
      </PageSection>

      <PageSection>
        {activeTabPath === Paths.insightsAllTab && (
          <AllInsightsTable
            tableName="all-insights-table"
            tableAriaLabel="Insights table"
            affectedAppsPath={Paths.insightsAllAffectedApplications}
            columns={{
              effort: false,
            }}
            useFetchData={useFetchReportAllInsights}
          />
        )}
        {activeTabPath === Paths.insightsSingleAppTab && (
          <>
            <SingleApplicationInsightsTable
              tableName="single-application-insights-table"
              tableAriaLabel="Single application insights table"
              pathPattern={Paths.insightsSingleAppSelected}
              keyPrefix={TablePersistenceKeyPrefix.insights}
              columns={{
                effort: false,
              }}
              useFetchData={useFetchReportApplicationInsights}
              onInsightClick={setInsightInDetailDrawer}
            />
            <InsightDetailDrawer
              insightId={insightInDetailDrawer?.id || null}
              onCloseClick={() => setInsightInDetailDrawer(null)}
            />
          </>
        )}
      </PageSection>

      <ConfirmDialog
        isOpen={!!navConfirmPath}
        title={`Navigating to ${
          navConfirmPath === Paths.insightsSingleAppTab
            ? "single application"
            : "all insights"
        }`}
        titleIconVariant="info"
        message={`When navigating to the ${
          navConfirmPath === Paths.insightsSingleAppTab
            ? "single application"
            : "all insights"
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

export default InsightsPage;
