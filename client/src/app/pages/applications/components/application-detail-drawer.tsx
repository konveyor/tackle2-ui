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

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: Application | null;
  showReportsTab?: boolean;
}

enum TabKey {
  Details = 0,
  Tags,
  Reports,
}

// TODO(mturley) -- move all content from expanded rows into here!
// TODO(mturley) -- add filters and other features from new design!

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({ onCloseClick, application, showReportsTab = false }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );
  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
    >
      {application && (
        <>
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
              <TextContent className={spacing.mtMd}>
                <Text component="small">Details content goes here!</Text>
              </TextContent>
            </Tab>
            <Tab
              eventKey={TabKey.Tags}
              title={<TabTitleText>Tags</TabTitleText>}
            >
              <TextContent className={spacing.mtMd}>
                <Text component="small">Tags content goes here!</Text>
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
        </>
      )}
    </PageDrawerContent>
  );
};
