import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Text,
  TextContent,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { Archetype, Ref, Tag, TagRef } from "@app/api/models";
import { DrawerTabContent } from "@app/components/detail-drawer";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { LabelsFromTags } from "@app/components/labels/labels-from-tags/labels-from-tags";
import { dedupeArrayOfObjects } from "@app/utils/utils";
import { RiskLabel } from "@app/components/RiskLabel";

import LinkToArchetypeApplications from "./link-to-archetype-applications";

const TagLabels: React.FC<{ tags?: Tag[] }> = ({ tags }) => (
  <LabelsFromTags tags={tags} />
);

const StakeholderLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => <LabelsFromItems items={archetype.stakeholders as Ref[]} />;

const StakeholderGroupsLabels: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => <LabelsFromItems items={archetype.stakeholderGroups as Ref[]} />;

export const TabDetailsContent: React.FC<{
  archetype: Archetype;
}> = ({ archetype }) => {
  const { t } = useTranslation();

  const manualTags: TagRef[] = useMemo(() => {
    const rawManualTags: TagRef[] =
      archetype.tags?.filter((t) => !t?.source) ?? [];
    return dedupeArrayOfObjects<TagRef>(rawManualTags, "name");
  }, [archetype.tags]);

  const assessmentTags: TagRef[] = useMemo(() => {
    const rawAssessmentTags: TagRef[] =
      archetype.tags?.filter((t) => t?.source === "assessment") ?? [];
    return dedupeArrayOfObjects<TagRef>(rawAssessmentTags, "name");
  }, [archetype.tags]);

  return (
    <DrawerTabContent>
      <DescriptionList className={spacing.mtMd}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.description")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype.description || (
              <EmptyTextMessage message={t("terms.notAvailable")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.applications")}</DescriptionListTerm>
          <DescriptionListDescription>
            <LinkToArchetypeApplications
              archetype={archetype}
              noApplicationsMessage={
                <EmptyTextMessage message={t("terms.none")} />
              }
            />
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsCriteria")}</DescriptionListTerm>
          <DescriptionListDescription>
            {(archetype.criteria?.length ?? 0) > 0 ? (
              <TagLabels tags={archetype.criteria} />
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
                  <Text>
                    {t("terms.stakeholder", {
                      count: archetype.stakeholders?.length ?? 0,
                    })}
                  </Text>
                </TextContent>
              </StackItem>
              <StackItem>
                {(archetype.stakeholders?.length ?? 0) > 0 ? (
                  <StakeholderLabels archetype={archetype} />
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
                  <Text>
                    {t("terms.stakeholderGroup", {
                      count: archetype.stakeholderGroups?.length ?? 0,
                    })}
                  </Text>
                </TextContent>
              </StackItem>
              <StackItem>
                {(archetype.stakeholderGroups?.length ?? 0) > 0 ? (
                  <StakeholderGroupsLabels archetype={archetype} />
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
            {archetype.comments || (
              <EmptyTextMessage message={t("terms.notAvailable")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>
            {t("terms.riskFromArchetype")}
          </DescriptionListTerm>
          <DescriptionListDescription>
            <RiskLabel risk={archetype.risk} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </DrawerTabContent>
  );
};
