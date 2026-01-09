import "./archetype-detail-drawer.css";
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

import { Archetype } from "@app/api/models";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import {
  DrawerTabContent,
  DrawerTabsContainer,
  NoEntitySelected,
} from "@app/components/detail-drawer";
import { ReviewFields } from "@app/components/detail-drawer/review-fields";

import { TabDetailsContent } from "./tab-details-content";
import { TabTargetProfiles } from "./tab-target-profiles";

export interface IArchetypeDetailDrawerProps {
  onCloseClick: () => void;
  archetype: Archetype | null;
}

enum TabKey {
  Details = 0,
  TargetProfiles,
  Reviews,
}

const ArchetypeDetailDrawer: React.FC<IArchetypeDetailDrawerProps> = ({
  onCloseClick,
  archetype,
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
                <ReviewFields archetype={archetype} />
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
