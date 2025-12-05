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

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import { StateNoData } from "@app/components/StateNoData";
import { useFetchInsight } from "@app/queries/analysis";

import { getInsightTitle } from "./helpers";
import { InsightAffectedFilesTable } from "./insight-affected-files-table";

export interface IInsightDetailDrawerProps extends Pick<
  IPageDrawerContentProps,
  "onCloseClick"
> {
  insightId: number | null;
}

enum TabKey {
  AffectedFiles = 0,
}

export const InsightDetailDrawer: React.FC<IInsightDetailDrawerProps> = ({
  insightId,
  onCloseClick,
}) => {
  const { t } = useTranslation();
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
            {t("terms.insight")}
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
