import "./platform-detail-drawer.css";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  TextContent,
  Text,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tabs,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { SourcePlatform } from "@app/api/models";

import { PageDrawerContent } from "@app/components/PageDrawerContext";
import PlatformAppsTable from "./platform-applications-table";
import {
  DrawerTabContent,
  DrawerTabsContainer,
} from "@app/components/detail-drawer";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { usePlatformKindList } from "../usePlatformKindList";

export interface IPlatformDetailDrawerProps {
  onCloseClick: () => void;
  platform: SourcePlatform | null;
}

enum TabKey {
  Details = 0,
  Coordinates,
  Applications,
}

const PlatformDetailDrawer: React.FC<IPlatformDetailDrawerProps> = ({
  onCloseClick,
  platform,
}) => {
  const { t } = useTranslation();
  const { getDisplayLabel } = usePlatformKindList();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!platform}
      onCloseClick={onCloseClick}
      focusKey={platform?.id}
      pageKey="platform-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("titles.platformDrawer")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {platform?.name}
          </Title>
        </TextContent>
      }
    >
      <DrawerTabsContainer>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        >
          <Tab
            eventKey={TabKey.Details}
            title={<TabTitleText>{t("terms.details")}</TabTitleText>}
          >
            <DrawerTabContent>
              <DescriptionList className="platform-detail-drawer-list">
                <DescriptionListGroup>
                  <DescriptionListTerm>{t("terms.name")}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {platform?.name}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.platformKind")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {getDisplayLabel(platform?.kind)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {platform?.url}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.credentials")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {/* TODO: Add a link to the identity when identity page can filter by urlParams */}
                    {platform?.identity ? (
                      platform.identity.name
                    ) : (
                      <EmptyTextMessage message={t("terms.none")} />
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </DrawerTabContent>
          </Tab>

          {/* TODO: Add this back if Platforms need schema defined coordinates */}
          {/*
          <Tab
            eventKey={TabKey.Coordinates}
            title={<TabTitleText>{t("terms.coordinates")}</TabTitleText>}
          >
            <DrawerTabContent>
              <DrawerTabContentSection label={t("terms.coordinates")}>
                <SchemaDefinedField
                  jsonDocument={platform?.coordinates ?? {}}
                  jsonSchema={undefined}
                />
              </DrawerTabContentSection>
            </DrawerTabContent>
          </Tab>
          */}

          <Tab
            eventKey={TabKey.Applications}
            title={<TabTitleText>{t("terms.applications")}</TabTitleText>}
          >
            <DrawerTabContent>
              <PlatformAppsTable
                platformApplications={platform?.applications}
              />
            </DrawerTabContent>
          </Tab>
        </Tabs>
      </DrawerTabsContainer>
    </PageDrawerContent>
  );
};

export default PlatformDetailDrawer;
