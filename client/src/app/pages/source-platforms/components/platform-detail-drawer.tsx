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
import { JsonSchemaObject, SourcePlatform } from "@app/api/models";

import { PageDrawerContent } from "@app/components/PageDrawerContext";
import PlatformAppsTable from "./platform-applications-table";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";

// just until we get those from the hub
import myJson from "@app/components/schema-defined-fields/myJson.json";
import mySchema from "@app/components/schema-defined-fields/mySchema.json";

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
            <SchemaDefinedField
              baseJsonDocument={myJson}
              jsonSchema={mySchema as JsonSchemaObject}
            />
          </Tab>
          <Tab
            eventKey={TabKey.Applications}
            title={<TabTitleText>{t("terms.applications")}</TabTitleText>}
          >
            <PlatformAppsTable platformApplications={platform?.applications} />
          </Tab>
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

export default PlatformDetailDrawer;
