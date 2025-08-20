import "./archetype-detail-drawer.css";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  TextContent,
  Text,
  Title,
  Tabs,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Archetype, Review } from "@app/api/models";

import { PageDrawerContent } from "@app/components/PageDrawerContext";
import { ReviewFields } from "@app/components/detail-drawer/review-fields";
import {
  DrawerTabContent,
  DrawerTabsContainer,
  NoEntitySelected,
} from "@app/components/detail-drawer";
import { TabTargetProfiles } from "./tab-target-profiles";
import { TabDetailsContent } from "./tab-details-content";

export interface IArchetypeDetailDrawerProps {
  onCloseClick: () => void;
  archetype: Archetype | null;
  reviews?: Review[];
}

enum TabKey {
  Details = 0,
  TargetProfiles,
  Reviews,
}

const ArchetypeDetailDrawer: React.FC<IArchetypeDetailDrawerProps> = ({
  onCloseClick,
  archetype,
  reviews,
}) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!archetype}
      onCloseClick={onCloseClick}
      pageKey="archetype-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("titles.archetypeDrawer")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {archetype ? archetype.name : "No archetype selected"}
          </Title>
        </TextContent>
      }
    >
      {archetype ? (
        <DrawerTabsContainer>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          >
            <Tab
              eventKey={TabKey.Details}
              title={<TabTitleText>{t("terms.details")}</TabTitleText>}
            >
              <TabDetailsContent archetype={archetype} />
            </Tab>
            <Tab
              eventKey={TabKey.TargetProfiles}
              title={<TabTitleText>{t("terms.targetProfiles")}</TabTitleText>}
            >
              <TabTargetProfiles archetype={archetype} />
            </Tab>
            <Tab
              eventKey={TabKey.Reviews}
              title={<TabTitleText>{t("terms.review")}</TabTitleText>}
            >
              <DrawerTabContent>
                <ReviewFields archetype={archetype} reviews={reviews} />
              </DrawerTabContent>
            </Tab>
          </Tabs>
        </DrawerTabsContainer>
      ) : (
        <NoEntitySelected entityName={t("terms.archetype").toLowerCase()} />
      )}
    </PageDrawerContent>
  );
};

export default ArchetypeDetailDrawer;
