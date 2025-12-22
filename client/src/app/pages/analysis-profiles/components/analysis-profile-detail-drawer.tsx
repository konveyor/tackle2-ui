import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AnalysisProfile } from "@app/api/models";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import {
  DrawerTabsContainer,
  NoEntitySelected,
} from "@app/components/detail-drawer";

import { TabDetailsContent } from "./tab-details-content";

export interface IAnalysisProfileDetailDrawerProps {
  onCloseClick: () => void;
  analysisProfile: AnalysisProfile | null;
}

enum TabKey {
  Details = 0,
}

const AnalysisProfileDetailDrawer: React.FC<
  IAnalysisProfileDetailDrawerProps
> = ({ onCloseClick, analysisProfile }) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!analysisProfile}
      onCloseClick={onCloseClick}
      pageKey="analysis-profile-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("titles.analysisProfileDrawer")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {analysisProfile
              ? analysisProfile.name
              : t("message.noAnalysisProfileSelected")}
          </Title>
        </TextContent>
      }
    >
      {analysisProfile ? (
        <DrawerTabsContainer>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          >
            <Tab
              eventKey={TabKey.Details}
              title={<TabTitleText>{t("terms.details")}</TabTitleText>}
            >
              <TabDetailsContent analysisProfile={analysisProfile} />
            </Tab>
          </Tabs>
        </DrawerTabsContainer>
      ) : (
        <NoEntitySelected
          entityName={t("terms.analysisProfile").toLowerCase()}
        />
      )}
    </PageDrawerContent>
  );
};

export default AnalysisProfileDetailDrawer;
