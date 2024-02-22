import "./archetype-detail-drawer.css";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  TextContent,
  Text,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Stack,
  StackItem,
  Tabs,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Archetype, Ref, Tag, TagRef } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PageDrawerContent } from "@app/components/PageDrawerContext";

import { dedupeArrayOfObjects } from "@app/utils/utils";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { ReviewFields } from "@app/pages/applications/components/application-detail-drawer/review-fields";
import { RiskLabel } from "@app/components/RiskLabel";
import { LabelsFromTags } from "@app/components/labels/labels-from-tags/labels-from-tags";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { Paths } from "@app/Paths";
import { Link } from "react-router-dom";

export interface IArchetypeDetailDrawerProps {
  onCloseClick: () => void;
  archetype: Archetype | null;
}

enum TabKey {
  Details = 0,
  Reviews,
}

const ArchetypeDetailDrawer: React.FC<IArchetypeDetailDrawerProps> = ({
  onCloseClick,
  archetype,
}) => {
  const { t } = useTranslation();

  const manualTags: TagRef[] = useMemo(() => {
    const rawManualTags: TagRef[] =
      archetype?.tags?.filter((t) => !t?.source) ?? [];
    return dedupeArrayOfObjects<TagRef>(rawManualTags, "name");
  }, [archetype?.tags]);

  const assessmentTags: TagRef[] = useMemo(() => {
    const rawAssessmentTags: TagRef[] =
      archetype?.tags?.filter((t) => t?.source === "assessment") ?? [];
    return dedupeArrayOfObjects<TagRef>(rawAssessmentTags, "name");
  }, [archetype?.tags]);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(
    TabKey.Details
  );

  return (
    <PageDrawerContent
      isExpanded={!!archetype}
      onCloseClick={onCloseClick}
      focusKey={archetype?.id}
      pageKey="archetype-details"
      header={
        <TextContent>
          <Text component="small" className={spacing.mb_0}>
            {t("titles.archetypeDrawer")}
          </Text>
          <Title headingLevel="h2" size="lg" className={spacing.mtXs}>
            {archetype?.name}
          </Title>
        </TextContent>
      }
    >
      <div>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
        >
          <Tab
            eventKey={TabKey.Details}
            title={<TabTitleText>{t("terms.details")}</TabTitleText>}
          >
            <DescriptionList className="archetype-detail-drawer-list">
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.description")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {archetype?.description || (
                    <EmptyTextMessage message={t("terms.notAvailable")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.applications")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {archetype?.applications?.length ? (
                    <>
                      <Link to={getApplicationsUrl(archetype?.name)}>
                        {archetype.applications.length}{" "}
                        {t("terms.application", {
                          count: archetype.applications.length,
                          context:
                            archetype.applications.length > 1
                              ? "plural"
                              : "singular",
                        }).toLocaleLowerCase()}{" "}
                      </Link>
                    </>
                  ) : (
                    <EmptyTextMessage message={t("terms.none")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.tagsCriteria")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {archetype?.criteria?.length ?? 0 > 0 ? (
                    <TagLabels tags={archetype?.criteria} />
                  ) : (
                    <EmptyTextMessage message={t("terms.none")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.tagsArchetype")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {manualTags.length > 0 ? (
                    <TagLabels tags={manualTags} />
                  ) : (
                    <EmptyTextMessage message={t("terms.none")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.tagsAssessment")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {assessmentTags.length > 0 ? (
                    <TagLabels tags={assessmentTags} />
                  ) : (
                    <EmptyTextMessage message={t("terms.none")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t("terms.maintainers")}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Stack>
                    <StackItem>
                      <TextContent>
                        <Text>{t("terms.stakeholder(s)")}</Text>
                      </TextContent>
                    </StackItem>
                    <StackItem>
                      {archetype?.stakeholders?.length ?? 0 > 0 ? (
                        <StakeholderLabels archetype={archetype as Archetype} />
                      ) : (
                        <EmptyTextMessage message={t("terms.none")} />
                      )}
                    </StackItem>
                  </Stack>
                </DescriptionListDescription>
                <DescriptionListDescription>
                  <Stack>
                    <StackItem>
                      <TextContent>
                        <Text>{t("terms.stakeholderGroup(s)")}</Text>
                      </TextContent>
                    </StackItem>
                    <StackItem>
                      {archetype?.stakeholderGroups?.length ?? 0 > 0 ? (
                        <StakeholderGroupsLabels
                          archetype={archetype as Archetype}
                        />
                      ) : (
                        <EmptyTextMessage message={t("terms.none")} />
                      )}
                    </StackItem>
                  </Stack>
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t("terms.comments")}</DescriptionListTerm>
                <DescriptionListDescription>
                  {archetype?.comments || (
                    <EmptyTextMessage message={t("terms.notAvailable")} />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <TextContent className={spacing.mtLg}>
              <Title headingLevel="h3" size="md">
                {t("terms.riskFromArchetype")}
              </Title>
              <Text component="small" cy-data="comments">
                <RiskLabel risk={archetype?.risk || "unknown"} />
              </Text>
            </TextContent>
          </Tab>
          <Tab
            eventKey={TabKey.Reviews}
            title={<TabTitleText>{t("terms.review")}</TabTitleText>}
          >
            <ReviewFields archetype={archetype} />
          </Tab>
        </Tabs>
      </div>
      {/* TODO: action buttons -- primary: "Close", link: "Edit archetype" */}
    </PageDrawerContent>
  );
};

const TagLabels: React.FC<{ tags?: Tag[] }> = ({ tags }) => (
  <LabelsFromTags tags={tags} />
);

const StakeholderLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => <LabelsFromItems items={archetype.stakeholders as Ref[]} />;

const StakeholderGroupsLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => <LabelsFromItems items={archetype.stakeholderGroups as Ref[]} />;

export default ArchetypeDetailDrawer;

const getApplicationsUrl = (archetypeName: string) => {
  const filterValues = {
    archetypes: [archetypeName],
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};
