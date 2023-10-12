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
  LabelGroup,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Archetype, Ref, Tag, TagRef } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PageDrawerContent } from "@app/components/PageDrawerContext";

import { dedupeArrayOfObjects } from "@app/utils/utils";

export interface IArchetypeDetailDrawerProps {
  onCloseClick: () => void;
  archetype: Archetype | null;
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
  console.log("archetype", archetype);
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
      <DescriptionList className="archetype-detail-drawer-list">
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.description")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.description || (
              <EmptyTextMessage message={t("terms.notAvailable")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.applications")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.applications?.length ?? 0 > 0 ? (
              <ApplicationLabels applicationRefs={archetype?.applications} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsCriteria")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.criteria?.length ?? 0 > 0 ? (
              <TagLabels tags={archetype?.criteria} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsArchetype")}</DescriptionListTerm>
          <DescriptionListDescription>
            {manualTags.length > 0 ? (
              <TagLabels tags={manualTags} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsAssessment")}</DescriptionListTerm>
          <DescriptionListDescription>
            {assessmentTags.length > 0 ? (
              <TagLabels tags={assessmentTags} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.maintainers")}</DescriptionListTerm>
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
                  <StakeholderGroupsLabels archetype={archetype as Archetype} />
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

      {/* TODO: action buttons -- primary: "Close", link: "Edit archetype" */}
    </PageDrawerContent>
  );
};

const ApplicationLabels: React.FC<{ applicationRefs?: Ref[] }> = ({
  applicationRefs,
}) =>
  (applicationRefs?.length ?? 0) === 0 ? null : (
    <LabelGroup>
      {(applicationRefs as Ref[])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ref) => (
          <Label color="grey" key={ref.id}>
            {ref.name}
          </Label>
        ))}
    </LabelGroup>
  );

const TagLabels: React.FC<{ tags?: Tag[] }> = ({ tags }) =>
  (tags?.length ?? 0) === 0 ? null : (
    <LabelGroup>
      {(tags as Tag[])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((sh) => (
          <Label color="grey" key={sh.id}>
            {sh.name}
          </Label>
        ))}
    </LabelGroup>
  );

const StakeholderLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) =>
  (archetype.stakeholders?.length ?? 0) === 0 ? null : (
    <LabelGroup>
      {archetype.stakeholders?.map((sh) => (
        <Label color="orange" key={sh.id}>
          {sh.name}
        </Label>
      ))}
    </LabelGroup>
  );

const StakeholderGroupsLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) =>
  (archetype.stakeholderGroups?.length ?? 0) === 0 ? null : (
    <LabelGroup>
      {archetype.stakeholderGroups?.map((sh) => (
        <Label color="green" key={sh.id}>
          {sh.name}
        </Label>
      ))}
    </LabelGroup>
  );

export default ArchetypeDetailDrawer;
