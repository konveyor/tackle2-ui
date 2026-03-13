import { Suspense, lazy, useEffect } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Level,
  LevelItem,
  PageSection,
  PageSectionVariants,
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
const BusinessServices = lazy(() => import("./business-services"));
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
  const navigate = useNavigate();

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

            navigate(Paths[tabs[tabIndex as number] as keyof typeof Paths]);
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
      <PageSection>
        <Suspense fallback={<AppPlaceholder />}>
          <Routes>
            <Route path="stakeholders" element={<Stakeholders />} />
            <Route path="stakeholder-groups" element={<StakeholderGroups />} />
            <Route path="job-functions" element={<JobFunctions />} />
            <Route path="business-services" element={<BusinessServices />} />
            <Route path="tags" element={<Tags />} />
            <Route
              path=""
              element={<Navigate to={Paths.controlsStakeholders} replace />}
            />
          </Routes>
        </Suspense>
      </PageSection>
    </>
  );
};
