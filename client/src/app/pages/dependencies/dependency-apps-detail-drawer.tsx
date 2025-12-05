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

import { AnalysisDependency } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import { StateNoData } from "@app/components/StateNoData";

import { DependencyAppsTable } from "./dependency-apps-table";

export interface IDependencyAppsDetailDrawerProps extends Pick<
  IPageDrawerContentProps,
  "onCloseClick"
> {
  dependency: AnalysisDependency | null;
}

enum TabKey {
  Applications = 0,
}

export const DependencyAppsDetailDrawer: React.FC<
  IDependencyAppsDetailDrawerProps
> = ({ dependency, onCloseClick }) => {
  const { t } = useTranslation();

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
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            Dependency / Language
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {dependency?.name || ""} /{" "}
            {dependency?.provider || t("terms.none").toLocaleLowerCase()}
          </Title>
        </TextContent>
      }
    >
      {!dependency ? (
        <StateNoData />
      ) : (
        <div>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
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
        </div>
      )}
    </PageDrawerContent>
  );
};
