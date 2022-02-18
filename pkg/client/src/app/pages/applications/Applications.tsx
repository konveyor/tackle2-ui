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

const ApplicationTable = lazy(() => import("./applicationsTable"));
const ApplicationsTableAnalyze = lazy(
  () => import("./applicationsTableAnalyze")
);

export const Applications: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

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
          activeKey={"activeTabKey"}
          onSelect={(_event, tabKey) => history.push(Paths[tabKey])}
        >
          <Tab
            key="applicationsAssessments"
            eventKey="applicationsAssessments"
            title={<TabTitleText>Assessment</TabTitleText>}
          />
          <Tab
            key="applicationsAnalysis"
            eventKey="applicationsAnalysis"
            title={<TabTitleText>Analysis</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection>
        <Suspense fallback={<AppPlaceholder />}>
          <Switch>
            <Route
              path={Paths.applicationsAssessments}
              component={ApplicationTable}
            />
            <Route
              path={Paths.applicationsAnalysis}
              component={ApplicationsTableAnalyze}
            />
            <Redirect
              from={Paths.applications}
              to={Paths.applicationsAssessments}
              exact
            />
          </Switch>
        </Suspense>
      </PageSection>
    </>
  );
};
