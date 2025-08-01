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

import { Generator } from "@app/api/models";
import { PageDrawerContent } from "@app/components/PageDrawerContext";
import { RepositoryDetails } from "@app/components/detail-drawer/repository-details";
import GeneratorCollectionTable from "./generator-collection-table";
import { parametersToArray } from "../utils";

export interface IGeneratorDetailDrawerProps {
  onCloseClick: () => void;
  generator: Generator | null;
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
            <DetailsTab generator={generator} />
          </Tab>
          <Tab
            eventKey={TabKey.Values}
            title={<TabTitleText>{t("terms.values")}</TabTitleText>}
          >
            <ValuesTab generator={generator} />
          </Tab>
          <Tab
            eventKey={TabKey.Parameters}
            title={<TabTitleText>{t("terms.parameters")}</TabTitleText>}
          >
            <ParametersTab generator={generator} />
          </Tab>
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

export default GeneratorDetailDrawer;

const DetailsTab: React.FC<{ generator: Generator | null }> = ({
  generator,
}) => {
  const { t } = useTranslation();

  if (!generator) {
    return null;
  }

  return (
    <DescriptionList>
      <Text component="small">{generator.description}</Text>

      <DescriptionListGroup>
        <DescriptionListTerm>{t("terms.providerType")}</DescriptionListTerm>
        <DescriptionListDescription>
          {generator.kind}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>
          {t("terms.generatorTemplateRepository")}
        </DescriptionListTerm>
        <DescriptionListDescription>
          {generator?.repository ? (
            <RepositoryDetails repository={generator.repository} />
          ) : (
            t("terms.notAvailable")
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const ValuesTab: React.FC<{ generator: Generator | null }> = ({
  generator,
}) => {
  return (
    <GeneratorCollectionTable
      collection={parametersToArray(generator?.values || {}) || []}
    />
  );
};

const ParametersTab: React.FC<{ generator: Generator | null }> = ({
  generator,
}) => {
  return (
    <GeneratorCollectionTable
      collection={parametersToArray(generator?.params || {}) || []}
    />
  );
};
