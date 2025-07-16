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
import GeneratorCollectionTable from "./generator-collection-table";
import { parametersToArray } from "../utils";

export interface IGeneratorDetailDrawerProps {
  onCloseClick: () => void;
  generator: AssetGenerator | null;
}

enum TabKey {
  Details = 0,
  Parameters,
  Values,
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
              {generator?.repository?.url && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.repositoryUrl")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {generator?.repository?.url || ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {generator?.repository?.branch && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.repositoryBranch")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {generator?.repository?.branch || ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {generator?.repository?.kind && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.repositoryKind")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {generator?.repository?.kind || ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {generator?.repository?.path && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    {t("terms.repositoryPath")}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {generator?.repository?.path || ""}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </Tab>
          <Tab
            eventKey={TabKey.Parameters}
            title={<TabTitleText>{t("terms.parameters")}</TabTitleText>}
          >
            <GeneratorCollectionTable
              collection={parametersToArray(generator?.parameters || {}) || []}
            />
          </Tab>
          <Tab
            eventKey={TabKey.Values}
            title={<TabTitleText>{t("terms.values")}</TabTitleText>}
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
