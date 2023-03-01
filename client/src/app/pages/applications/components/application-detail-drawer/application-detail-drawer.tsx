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
  detailsTabDescriptionList: React.ReactNode;
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
> = ({
  onCloseClick,
  application,
  detailsTabDescriptionList,
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
              <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
                <Text component="small">TODO (description)</Text>
                <Title headingLevel="h3" size="md">
                  Business services
                </Title>
                <Text component="small">TODO</Text>
              </TextContent>
              {detailsTabDescriptionList}
              <TextContent className={spacing.mtLg}>
                <Title headingLevel="h3" size="md">
                  Reviewer comments
                </Title>
                <Text component="small">TODO</Text>
                <Title headingLevel="h3" size="md">
                  Comments
                </Title>
                <Text component="small">TODO</Text>
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
