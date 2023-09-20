import * as React from "react";
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

import { Archetype, Tag } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { PageDrawerContent } from "@app/components/PageDrawerContext";

import "./archetype-detail-drawer.css";

export interface IArchetypeDetailDrawerProps {
  onCloseClick: () => void;
  archetype: Archetype | null;
}

const ArchetypeDetailDrawer: React.FC<IArchetypeDetailDrawerProps> = ({
  onCloseClick,
  archetype,
}) => {
  const { t } = useTranslation();

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
          <DescriptionListTerm>{t("terms.tagsCriteria")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.criteriaTags?.length ?? 0 > 0 ? (
              <TagLabels tags={archetype?.criteriaTags} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsArchetype")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.tags?.length ?? 0 > 0 ? (
              <TagLabels tags={archetype?.tags} />
            ) : (
              <EmptyTextMessage message={t("terms.none")} />
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.tagsAssessment")}</DescriptionListTerm>
          <DescriptionListDescription>
            {archetype?.assessmentTags?.length ?? 0 > 0 ? (
              <TagLabels tags={archetype?.assessmentTags} />
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
