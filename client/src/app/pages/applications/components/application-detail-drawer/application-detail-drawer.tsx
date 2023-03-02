import * as React from "react";
import {
  TextContent,
  Text,
  Title,
  Tabs,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Application } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";
import { ApplicationBusinessService } from "../application-business-service";
import { ApplicationTags } from "../application-tags";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: Application | null;
  detailsTabMainContent: React.ReactNode;
  showReportsTab?: boolean;
}

enum TabKey {
  Details = 0,
  Tags,
  Reports,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({
  onCloseClick,
  application,
  detailsTabMainContent,
  showReportsTab = false,
}) => {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );
  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
    >
      <TextContent>
        <Text component="small" className={spacing.mb_0}>
          Name
        </Text>
        <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
          {application?.name}
        </Title>
      </TextContent>
      <Tabs
        activeKey={activeTabKey}
        onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        className={spacing.mtLg}
      >
        <Tab
          eventKey={TabKey.Details}
          title={<TabTitleText>Details</TabTitleText>}
        >
          <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
            <Text component="small">{application?.description}</Text>
            <Title headingLevel="h3" size="md">
              Business service
            </Title>
            <Text component="small">
              {application?.businessService && (
                <ApplicationBusinessService
                  id={application.businessService.id}
                />
              )}
            </Text>
          </TextContent>
          {detailsTabMainContent}
        </Tab>
        <Tab eventKey={TabKey.Tags} title={<TabTitleText>Tags</TabTitleText>}>
          <TextContent className={spacing.mtMd}>
            <Text component="small">
              {/* TODO(mturley): group tabs by source and tag-type, add filter dropdowns */}
              {application && <ApplicationTags application={application} />}
            </Text>
          </TextContent>
        </Tab>
        {showReportsTab && (
          <Tab
            eventKey={TabKey.Reports}
            title={<TabTitleText>Reports</TabTitleText>}
          >
            <TextContent className={spacing.mtMd}>
              <Text component="small">Reports content goes here!</Text>
            </TextContent>
          </Tab>
        )}
      </Tabs>
    </PageDrawerContent>
  );
};
