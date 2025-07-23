import * as React from "react";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import {
  TextContent,
  Text,
  Title,
  Tabs,
  TabTitleText,
  Tab,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { InsightAffectedFilesTable } from "./insight-affected-files-table";
import { useFetchInsight } from "@app/queries/analysis";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { StateNoData } from "@app/components/StateNoData";
import { getInsightTitle } from "../helpers";

export interface IInsightDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  insightId: number | null;
}

enum TabKey {
  AffectedFiles = 0,
}

export const InsightDetailDrawer: React.FC<IInsightDetailDrawerProps> = ({
  insightId,
  onCloseClick,
}) => {
  const {
    result: { data: insight },
    isFetching,
  } = useFetchInsight(insightId || undefined);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.AffectedFiles
  );

  return (
    <PageDrawerContent
      isExpanded={insightId !== null}
      onCloseClick={onCloseClick}
      focusKey={insightId || ""}
      pageKey="affected-applications"
      drawerPanelContentProps={{ defaultSize: "600px" }}
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            Insight
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {insight ? getInsightTitle(insight) : ""}
          </Title>
        </TextContent>
      }
    >
      {isFetching ? (
        <AppPlaceholder />
      ) : !insight ? (
        <StateNoData />
      ) : (
        <div>
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
            className={spacing.mtLg}
          >
            <Tab
              eventKey={TabKey.AffectedFiles}
              title={<TabTitleText>Affected files</TabTitleText>}
            >
              <InsightAffectedFilesTable insight={insight} />
            </Tab>
          </Tabs>
        </div>
      )}
    </PageDrawerContent>
  );
};
