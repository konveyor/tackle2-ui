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

const Stakeholders = lazy(() => import("./stakeholders"));
const StakeholderGroups = lazy(() => import("./stakeholder-groups"));
const JobFunctions = lazy(() => import("./job-functions"));
const businessServices = lazy(() => import("./business-services"));
const Tags = lazy(() => import("./tags"));

export const Controls: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{t("terms.controls")}</Title>
          </LevelItem>
        </Level>
        <Tabs
          activeKey={"activeTabKey"}
          onSelect={(_event, tabKey) => history.push(Paths[tabKey])}
        >
          <Tab
            key="controlsStakeholders"
            eventKey="controlsStakeholders"
            title={<TabTitleText>Stakeholders</TabTitleText>}
          />
          <Tab
            key="controlsStakeholderGroups"
            eventKey="controlsStakeholderGroups"
            title={<TabTitleText>Stakeholders groups</TabTitleText>}
          />
          <Tab
            key="controlsJobFunctions"
            eventKey="controlsJobFunctions"
            title={<TabTitleText>Job functions</TabTitleText>}
          />
          <Tab
            key="controlsBusinessServices"
            eventKey="controlsBusinessServices"
            title={<TabTitleText>Business services</TabTitleText>}
          />
          <Tab
            key="controlsTags"
            eventKey="controlsTags"
            title={<TabTitleText>Tags</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection>
        <Suspense fallback={<AppPlaceholder />}>
          <Switch>
            <Route path={Paths.controlsStakeholders} component={Stakeholders} />
            <Route
              path={Paths.controlsStakeholderGroups}
              component={StakeholderGroups}
            />
            <Route path={Paths.controlsJobFunctions} component={JobFunctions} />
            <Route
              path={Paths.controlsBusinessServices}
              component={businessServices}
            />
            <Route path={Paths.controlsTags} component={Tags} />
            <Redirect
              from={Paths.controls}
              to={Paths.controlsStakeholders}
              exact
            />
          </Switch>
        </Suspense>
      </PageSection>
    </>
  );
};
