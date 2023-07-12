import * as React from "react";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/shared/page-drawer-context";
import {
  TextContent,
  Text,
  Title,
  Tabs,
  TabTitleText,
  Tab,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisDependency } from "@app/api/models";
import { StateNoData } from "@app/shared/components/app-table/state-no-data";
import { DependencyAppsTable } from "./dependency-apps-table";

export interface IDependencyAppsDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  dependency: AnalysisDependency | null;
}

enum TabKey {
  Applications = 0,
}

export const DependencyAppsDetailDrawer: React.FC<
  IDependencyAppsDetailDrawerProps
> = ({ dependency, onCloseClick }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Applications
  );

  return (
    <PageDrawerContent
      isExpanded={!!dependency}
      onCloseClick={onCloseClick}
      focusKey={dependency?.name}
      pageKey="analysis-app-dependencies"
      drawerPanelContentProps={{ defaultSize: "600px" }}
    >
      {!dependency ? (
        <StateNoData />
      ) : (
        <>
          <TextContent>
            <Text component="small" className={spacing.mb_0}>
              Dependencies
            </Text>
            <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
              {dependency?.name || ""}
            </Title>
          </TextContent>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
            className={spacing.mtLg}
          >
            <Tab
              eventKey={TabKey.Applications}
              title={<TabTitleText>Applications</TabTitleText>}
            >
              {dependency ? (
                <DependencyAppsTable dependency={dependency} />
              ) : null}
            </Tab>
          </Tabs>
        </>
      )}
    </PageDrawerContent>
  );
};
