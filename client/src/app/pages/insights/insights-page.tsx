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
import { InsightsTable } from "./insights-table";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { TablePersistenceKeyPrefix } from "@app/Constants";

export enum InsightFilterGroups {
  ApplicationInventory = "Application inventory",
  Insights = "Insights",
}

export type InsightsTabPath =
  | typeof Paths.issuesAllTab
  | typeof Paths.issuesSingleAppTab;

export const InsightsPage: React.FC = () => {
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
    React.useState<InsightsTabPath | null>(null);

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
              `${TablePersistenceKeyPrefix.issues}:filters`
            );
            if (pageHasFilters) {
              setNavConfirmPath(tabPath as InsightsTabPath);
            } else {
              history.push(tabPath as InsightsTabPath);
            }
          }}
        >
          <Tab
            eventKey={Paths.issuesAllTab}
            title={<TabTitleText>All insights</TabTitleText>}
          />
          <Tab
            eventKey={Paths.issuesSingleAppTab}
            title={<TabTitleText>Single application</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection>
        {activeTabPath === Paths.issuesAllTab ? (
          <InsightsTable mode="allInsights" />
        ) : activeTabPath === Paths.issuesSingleAppTab ? (
          <InsightsTable mode="singleApp" />
        ) : null}
      </PageSection>
      <ConfirmDialog
        isOpen={!!navConfirmPath}
        title={`Navigating to ${
          navConfirmPath === Paths.issuesSingleAppTab
            ? "single application"
            : "all insights"
        }`}
        titleIconVariant="info"
        message={`When navigating to the ${
          navConfirmPath === Paths.issuesSingleAppTab
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
