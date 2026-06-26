import { Suspense, lazy, useMemo } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
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
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

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

  const location = useLocation();

  const activeTabKey = useMemo(() => {
    switch (location.pathname) {
      case "/controls/stakeholders":
        return 0;
      case "/controls/stakeholder-groups":
        return 1;
      case "/controls/job-functions":
        return 2;
      case "/controls/business-services":
        return 3;
      case "/controls/tags":
        return 4;
      default:
        return 0;
    }
  }, [location.pathname]);
  return (
    <>
      <PageSection hasBodyWrapper={false} className={spacing.pb_0}>
        <Level>
          <LevelItem>
            <Title headingLevel="h1">{t("terms.controls")}</Title>
          </LevelItem>
        </Level>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabIndex) => {
            history.push(Paths[tabs[tabIndex as number] as keyof typeof Paths]);
          }}
        >
          <Tab
            eventKey={0}
            title={<TabTitleText>{t("terms.stakeholders")}</TabTitleText>}
          />
          <Tab
            eventKey={1}
            title={<TabTitleText>{t("terms.stakeholderGroups")}</TabTitleText>}
          />
          <Tab
            eventKey={2}
            title={<TabTitleText>{t("terms.jobFunctions")}</TabTitleText>}
          />
          <Tab
            eventKey={3}
            title={<TabTitleText>{t("terms.businessServices")}</TabTitleText>}
          />
          <Tab
            eventKey={4}
            title={<TabTitleText>{t("terms.tags")}</TabTitleText>}
          />
        </Tabs>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
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
