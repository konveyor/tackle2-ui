import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { MigratorConfig } from "@app/api/models";
import { PageDrawerContent } from "@app/components/PageDrawerContext";

export interface IMigratorDetailDrawerProps {
  onCloseClick: () => void;
  migrator: MigratorConfig | null;
}

enum TabKey {
  Details = 0,
  Pallet,
}

const MigratorDetailDrawer: React.FC<IMigratorDetailDrawerProps> = ({
  onCloseClick,
  migrator,
}) => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!migrator}
      onCloseClick={onCloseClick}
      focusKey={migrator?.id}
      pageKey="migrator-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            Migrator Details
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {migrator?.name}
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
            <DetailsTab migrator={migrator} />
          </Tab>
          <Tab
            eventKey={TabKey.Pallet}
            title={<TabTitleText>Pallet</TabTitleText>}
          >
            <PalletTab migrator={migrator} />
          </Tab>
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

export default MigratorDetailDrawer;

const DetailsTab: React.FC<{ migrator: MigratorConfig | null }> = ({
  migrator,
}) => {
  const { t } = useTranslation();

  if (!migrator) {
    return null;
  }

  return (
    <DescriptionList>
      {migrator.description && (
        <Text component="small">{migrator.description}</Text>
      )}

      <DescriptionListGroup>
        <DescriptionListTerm>Migration Target</DescriptionListTerm>
        <DescriptionListDescription>
          {migrator.migrationTarget || t("terms.notAvailable")}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Source Repository</DescriptionListTerm>
        <DescriptionListDescription>
          {migrator.sourceRepository?.url || t("terms.notAvailable")}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Source Branch</DescriptionListTerm>
        <DescriptionListDescription>
          {migrator.sourceRepository?.branch || "main"}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Asset Repository</DescriptionListTerm>
        <DescriptionListDescription>
          {migrator.assetRepository?.url || t("terms.notAvailable")}
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>Asset Output Branch</DescriptionListTerm>
        <DescriptionListDescription>
          {migrator.assetRepository?.branch || t("terms.notAvailable")}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const PalletTab: React.FC<{ migrator: MigratorConfig | null }> = ({
  migrator,
}) => {
  if (!migrator?.pallet) {
    return <Text component="small">No pallet configuration defined.</Text>;
  }

  return (
    <DescriptionList>
      {migrator.pallet.archetype && (
        <DescriptionListGroup>
          <DescriptionListTerm>Archetype</DescriptionListTerm>
          <DescriptionListDescription>
            {migrator.pallet.archetype.name}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {migrator.pallet.skills && migrator.pallet.skills.length > 0 && (
        <DescriptionListGroup>
          <DescriptionListTerm>Skills</DescriptionListTerm>
          <DescriptionListDescription>
            {migrator.pallet.skills.join(", ")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {migrator.pallet.yaml && (
        <DescriptionListGroup>
          <DescriptionListTerm>Pallet YAML</DescriptionListTerm>
          <DescriptionListDescription>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 300,
                overflow: "auto",
                background: "var(--pf-v5-global--BackgroundColor--200)",
                padding: "var(--pf-v5-global--spacer--sm)",
                borderRadius: 4,
                fontSize: "0.85em",
              }}
            >
              {migrator.pallet.yaml}
            </pre>
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};
