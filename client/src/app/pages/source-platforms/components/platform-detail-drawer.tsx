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

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import LinkToPlatformApplications from "./link-to-platform-applications";

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
      <div>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        >
          <Tab
            eventKey={TabKey.Details}
            title={<TabTitleText>{t("terms.details")}</TabTitleText>}
          >
            <DescriptionList className="platform-detail-drawer-list">
              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.name")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {platform?.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.providerType")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {platform?.kind}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {platform?.url}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </Tab>
          <Tab
            eventKey={TabKey.Coordinates}
            title={<TabTitleText>{t("terms.coordinates")}</TabTitleText>}
          >
            <DescriptionList className="platform-coordinates-drawer-list"></DescriptionList>
          </Tab>
          <Tab
            eventKey={TabKey.Applications}
            title={<TabTitleText>{t("terms.applications")}</TabTitleText>}
          >
            <DescriptionList className="platform-applications-drawer-list">
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.applications")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <LinkToPlatformApplications
                    platform={platform}
                    noApplicationsMessage={
                      <EmptyTextMessage message={t("terms.none")} />
                    }
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </Tab>
        </Tabs>
      </div>
      {/* TODO: action buttons -- primary: "Close", link: "Edit archetype" */}
    </PageDrawerContent>
  );
};

export default PlatformDetailDrawer;
