import * as React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  TextContent,
  Text,
  TextVariants,
  Title,
  Tabs,
  Tab,
  TabTitleText,
  Spinner,
  Bullseye,
  List,
  ListItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Application, Task } from "@app/api/models";
import {
  IPageDrawerContentProps,
  PageDrawerContent,
} from "@app/components/PageDrawerContext";
import {
  getDependenciesUrlFilteredByAppName,
  getIssuesSingleAppSelectedLocation,
} from "@app/pages/issues/helpers";
import { ApplicationTags } from "../application-tags";
import { ApplicationDetailFields } from "./application-detail-fields";

export interface IApplicationDetailDrawerProps
  extends Pick<IPageDrawerContentProps, "onCloseClick"> {
  application: Application | null;
  task: Task | undefined | null;
  applications?: Application[];
  detailTabContent?: React.ReactNode;
  reportsTabContent?: React.ReactNode;
  factsTabContent?: React.ReactNode;
  reviewsTabContent?: React.ReactNode;
  onEditClick: () => void;
}

enum TabKey {
  Details = 0,
  Tags,
  Reports,
  Facts,
  Reviews,
}

export const ApplicationDetailDrawer: React.FC<
  IApplicationDetailDrawerProps
> = ({
  onCloseClick,
  onEditClick,
  application,
  task,
  detailTabContent = null,
  reportsTabContent = null,
  factsTabContent = null,
  reviewsTabContent = null,
}) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  const isTaskRunning = task?.state === "Running";

  return (
    <PageDrawerContent
      isExpanded={!!application}
      onCloseClick={onCloseClick}
      focusKey={application?.id}
      pageKey="app-inventory"
    >
      <TextContent>
        <Text component="small" className={spacing.mb_0}>
          {t("terms.name")}
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
          title={<TabTitleText>{t("terms.details")}</TabTitleText>}
        >
          <TextContent className={`${spacing.mtMd} ${spacing.mbMd}`}>
            <Text component="small">{application?.description}</Text>
            <List isPlain>
              {application ? (
                <>
                  <ListItem>
                    <Link
                      to={getIssuesSingleAppSelectedLocation(application.id)}
                    >
                      Issues
                    </Link>
                  </ListItem>
                  <ListItem>
                    <Link
                      to={getDependenciesUrlFilteredByAppName(
                        application?.name
                      )}
                    >
                      Dependencies
                    </Link>
                  </ListItem>
                </>
              ) : null}
            </List>
            <Title headingLevel="h3" size="md">
              {t("terms.effort")}
            </Title>
            <Text component="small">
              <Text component="small">
                {application?.effort !== 0 && application?.effort !== undefined
                  ? application?.effort
                  : t("terms.unassigned")}
              </Text>
            </Text>
          </TextContent>

          {detailTabContent}
          <ApplicationDetailFields
            application={application}
            onEditClick={onEditClick}
            onCloseClick={onCloseClick}
          />
        </Tab>

        <Tab eventKey={TabKey.Tags} title={<TabTitleText>Tags</TabTitleText>}>
          {application && isTaskRunning ? (
            <Bullseye className={spacing.mtLg}>
              <TextContent>
                <Text component={TextVariants.h3}>
                  {t("message.taskInProgressForTags")}
                  <Spinner
                    isInline
                    aria-label="spinner when a new analysis is running"
                  />
                </Text>
              </TextContent>
            </Bullseye>
          ) : null}

          {application ? <ApplicationTags application={application} /> : null}
        </Tab>

        {reportsTabContent && task ? (
          <Tab
            eventKey={TabKey.Reports}
            title={<TabTitleText>{t("terms.reports")}</TabTitleText>}
          >
            {reportsTabContent}
          </Tab>
        ) : null}

        {factsTabContent ? (
          <Tab
            eventKey={TabKey.Facts}
            title={<TabTitleText>{t("terms.facts")}</TabTitleText>}
          >
            {factsTabContent}
          </Tab>
        ) : null}
        {reviewsTabContent ? (
          <Tab
            eventKey={TabKey.Reviews}
            title={<TabTitleText>{t("terms.reviews")}</TabTitleText>}
          >
            {reviewsTabContent}
          </Tab>
        ) : null}
      </Tabs>
    </PageDrawerContent>
  );
};
