import "./generator-detail-drawer.css";
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
import { AssetGenerator } from "@app/api/models";

import { PageDrawerContent } from "@app/components/PageDrawerContext";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";

// just until we get those from the hub
import myJson from "@app/components/schema-defined-fields/myJson.json";
import mySchema from "@app/components/schema-defined-fields/mySchema.json";
import GeneratorCollectionTable from "./generator-collection-table";
import { parametersToArray } from "../utils";

export interface IGeneratorDetailDrawerProps {
  onCloseClick: () => void;
  generator: AssetGenerator | null;
}

enum TabKey {
  Details = 0,
  Coordinates,
  Profiles,
}

const GeneratorDetailDrawer: React.FC<IGeneratorDetailDrawerProps> = ({
  onCloseClick,
  generator,
}) => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!generator}
      onCloseClick={onCloseClick}
      focusKey={generator?.id}
      pageKey="generator-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("titles.generatorDrawer")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {generator?.name}
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
            <DescriptionList className="generator-detail-drawer-list">
              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.name")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {generator?.name}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.providerType")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {generator?.kind}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.url")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {generator?.repository?.url || ""}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </Tab>
          <Tab
            eventKey={TabKey.Coordinates}
            title={<TabTitleText>{t("terms.coordinates")}</TabTitleText>}
          >
            <SchemaDefinedField jsonDocument={myJson} jsonSchema={mySchema} />
          </Tab>
          <Tab
            eventKey={TabKey.Profiles}
            title={<TabTitleText>{t("terms.Profiles")}</TabTitleText>}
          >
            <GeneratorCollectionTable
              collection={parametersToArray(generator?.values || {}) || []}
            />
          </Tab>
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

export default GeneratorDetailDrawer;
