import { Suspense, lazy, useMemo } from "react";
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

  const location = useLocation();

  const activeTabKey = useMemo(() => {
    switch (location.pathname) {
      case Paths.controlsStakeholders:
        return 0;
      case Paths.controlsStakeholderGroups:
        return 1;
      case Paths.controlsJobFunctions:
        return 2;
      case Paths.controlsBusinessServices:
        return 3;
      case Paths.controlsTags:
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
      <PageSection hasBodyWrapper={false}>
        <Suspense fallback={<AppPlaceholder />}>
          <Routes>
            <Route path="stakeholders" element={<Stakeholders />} />
            <Route path="stakeholder-groups" element={<StakeholderGroups />} />
            <Route path="job-functions" element={<JobFunctions />} />
            <Route path="business-services" element={<BusinessServices />} />
            <Route path="tags" element={<Tags />} />
            <Route
              index
              element={<Navigate to={Paths.controlsStakeholders} replace />}
            />
            <Route
              path="*"
              element={<Navigate to={Paths.controlsStakeholders} replace />}
            />
          </Routes>
        </Suspense>
      </PageSection>
    </>
  );
};
