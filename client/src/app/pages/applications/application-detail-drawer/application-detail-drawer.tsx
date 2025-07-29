import * as React from "react";
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

import { Manifest } from "@app/api/models";

import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import { ReviewFields } from "@app/components/detail-drawer/review-fields";

import { DecoratedApplication } from "../useDecoratedApplications";
import { SchemaDefinedField } from "@app/components/schema-defined-fields/SchemaDefinedFields";
import { useFetchApplicationManifest } from "@app/queries/applications";
import { usePlatformCoordinatesProvider } from "../usePlatformCoordinatesProvider";
import { TabDetailsContent } from "./tab-details-content";
import { TabTagsContent } from "./tab-tags-content";
import { TabReportsContent } from "./tab-reports-contents";
import { TabTasksContent } from "./tab-tasks-content";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: DecoratedApplication | null;
  onEditClick: () => void;
}

export enum TabKey {
  Details = 0,
  Tags,
  Reports,
  Facts,
  Reviews,
  Tasks,
  Manifest,
  PlatformCoordinates,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  const manifest = useFetchApplicationManifest(application?.id).manifest;

  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
      pageKey="app-inventory"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("terms.name")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {application?.name}
          </Title>
        </TextContent>
      }
    >
      <div>
        {/* this div is required so the tabs are visible */}
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
          className={spacing.mtLg}
        >
          {!application ? null : (
            <Tab
              eventKey={TabKey.Details}
              title={<TabTitleText>{t("terms.details")}</TabTitleText>}
            >
              <TabDetailsContent
                application={application}
                onCloseClick={onCloseClick}
                onEditClick={onEditClick}
              />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Tags}
              title={<TabTitleText>Tags</TabTitleText>}
            >
              <TabTagsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reports}
              title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
            >
              <TabReportsContent application={application} />
            </Tab>
          )}

          {!application ? null : (
            <Tab
              eventKey={TabKey.Reviews}
              title={<TabTitleText>{t("terms.review")}</TabTitleText>}
            >
              <ReviewFields application={application} />
            </Tab>
          )}
          {!application ? null : (
            <Tab
              eventKey={TabKey.Tasks}
              title={<TabTitleText>{t("terms.tasks")}</TabTitleText>}
            >
              <TabTasksContent application={application} />
            </Tab>
          )}
          {!application || !manifest ? null : (
            <Tab
              eventKey={TabKey.Manifest}
              title={<TabTitleText>{t("terms.manifest")}</TabTitleText>}
            >
              <TabManifestContent manifest={manifest} />
            </Tab>
          )}
          {!application || !application.platform ? null : (
            <Tab
              eventKey={TabKey.PlatformCoordinates}
              title={<TabTitleText>Platform Coordinates</TabTitleText>}
            >
              <TabPlatformCoordinatesContent application={application} />
            </Tab>
          )}
        </Tabs>
      </div>
    </PageDrawerContent>
  );
};

const TabPlatformCoordinatesContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  // TODO: get the platform coordinates from the application
  const { schema, document } = usePlatformCoordinatesProvider();
  return (
    <SchemaDefinedField
      className={spacing.mtLg}
      baseJsonDocument={document}
      jsonSchema={schema}
    />
  );
};

const TabManifestContent: React.FC<{
  manifest: Manifest;
}> = ({ manifest }) => {
  return (
    <SchemaDefinedField
      className={spacing.mtLg}
      baseJsonDocument={manifest}
      isReadOnly
    />
  );
};
