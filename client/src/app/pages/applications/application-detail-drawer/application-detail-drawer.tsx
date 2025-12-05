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

import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import {
  DrawerTabContent,
  DrawerTabsContainer,
  NoEntitySelected,
  ReviewFields,
} from "@app/components/detail-drawer";

import { DecoratedApplication } from "../useDecoratedApplications";

import { TabDetailsContent } from "./tab-details-content";
import { TabPlatformContent } from "./tab-platform-content";
import { TabReportsContent } from "./tab-reports-contents";
import { TabTagsContent } from "./tab-tags-content";
import { TabTasksContent } from "./tab-tasks-content";

export interface IApplicationDetailDrawerProps extends Pick<
  IPageDrawerContentProps,
  "onCloseClick"
> {
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
  Platform,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ application, onCloseClick, onEditClick }) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

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
      {application ? (
        <DrawerTabsContainer>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
            isOverflowHorizontal={{ showTabCount: true }}
          >
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

            <Tab
              eventKey={TabKey.Tags}
              title={<TabTitleText>{t("terms.tags")}</TabTitleText>}
            >
              <TabTagsContent application={application} />
            </Tab>

            <Tab
              eventKey={TabKey.Reports}
              title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
            >
              <TabReportsContent application={application} />
            </Tab>

            <Tab
              eventKey={TabKey.Reviews}
              title={<TabTitleText>{t("terms.review")}</TabTitleText>}
            >
              <DrawerTabContent>
                <ReviewFields application={application} />
              </DrawerTabContent>
            </Tab>

            <Tab
              eventKey={TabKey.Tasks}
              title={<TabTitleText>{t("terms.tasks")}</TabTitleText>}
            >
              <TabTasksContent application={application} />
            </Tab>

            <Tab
              eventKey={TabKey.Platform}
              title={<TabTitleText>{t("terms.platform")}</TabTitleText>}
            >
              <TabPlatformContent application={application} />
            </Tab>
          </Tabs>
        </DrawerTabsContainer>
      ) : (
        <NoEntitySelected entityName={t("terms.application").toLowerCase()} />
      )}
    </PageDrawerContent>
  );
};
