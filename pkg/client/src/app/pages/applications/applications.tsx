import React, { lazy, Suspense } from "react";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import {
  Level,
  LevelItem,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/shared/components";

import { useTranslation } from "react-i18next";

const ApplicationTable = lazy(() => import("./applications-table-assessment"));
const ApplicationsTableAnalyze = lazy(
  () => import("./applications-table-analyze")
);

const tabs: string[] = ["applicationsAssessmentTab", "applicationsAnalysisTab"];

export const Applications: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [activeTabKey, setActiveTabKey] = React.useState(0);

  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">
              {t("composed.applicationInventory")}
            </Title>
          </LevelItem>
        </Level>
        <Tabs
          className={spacing.mtSm}
          activeKey={activeTabKey}
          onSelect={(_event, tabIndex) => {
            setActiveTabKey(tabIndex as number);
            history.push(Paths[tabs[tabIndex as number] as keyof typeof Paths]);
          }}
        >
          <Tab eventKey={0} title={<TabTitleText>Assessment</TabTitleText>} />
          <Tab eventKey={1} title={<TabTitleText>Analysis</TabTitleText>} />
        </Tabs>
      </PageSection>
      <PageSection>
        <Suspense fallback={<AppPlaceholder />}>
          <Switch>
            <Route
              path={Paths.applicationsAssessmentTab}
              component={ApplicationTable}
            />
            <Route
              path={Paths.applicationsAnalysisTab}
              component={ApplicationsTableAnalyze}
            />
            <Redirect
              from={Paths.applications}
              to={Paths.applicationsAssessmentTab}
              exact
            />
          </Switch>
        </Suspense>
      </PageSection>
    </>
  );
};
