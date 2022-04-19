import React, { lazy, Suspense, useEffect } from "react";
import {
  Redirect,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
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

const tabs: string[] = [
  "controlsStakeholders",
  "controlsStakeholderGroups",
  "controlsJobFunctions",
  "controlsBusinessServices",
  "controlsTags",
];

export const Controls: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const [activeTabKey, setActiveTabKey] = React.useState(0);
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case "/controls/stakeholders":
        return setActiveTabKey(0);
      case "/controls/stakeholder-groups":
        return setActiveTabKey(1);
      case "/controls/job-functions":
        return setActiveTabKey(2);
      case "/controls/business-services":
        return setActiveTabKey(3);
      case "/controls/tags":
        return setActiveTabKey(4);
      default:
        return setActiveTabKey(0);
    }
  }, [location.pathname]);
  return (
    <>
      <PageSection variant={PageSectionVariants.light} className={spacing.pb_0}>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{t("terms.controls")}</Title>
          </LevelItem>
        </Level>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabIndex) => {
            setActiveTabKey(tabIndex as number);

            history.push(Paths[tabs[tabIndex as number] as keyof typeof Paths]);
          }}
        >
          <Tab eventKey={0} title={<TabTitleText>Stakeholders</TabTitleText>} />
          <Tab
            eventKey={1}
            title={<TabTitleText>Stakeholders groups</TabTitleText>}
          />
          <Tab
            eventKey={2}
            title={<TabTitleText>Job functions</TabTitleText>}
          />
          <Tab
            eventKey={3}
            title={<TabTitleText>Business services</TabTitleText>}
          />
          <Tab eventKey={4} title={<TabTitleText>Tags</TabTitleText>} />
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
