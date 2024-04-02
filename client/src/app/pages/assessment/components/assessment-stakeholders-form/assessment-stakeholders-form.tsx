import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  FormSection,
  Grid,
  GridItem,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";

import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergroups";
import { HookFormAutocomplete } from "@app/components/HookFormPFFields";
import { AssessmentWizardValues } from "../assessment-wizard/assessment-wizard";
import { GroupedStakeholderRef, Ref, StakeholderType } from "@app/api/models";

export const AssessmentStakeholdersForm: React.FC = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<AssessmentWizardValues>();

  const { stakeholders } = useFetchStakeholders();
  const { stakeholderGroups } = useFetchStakeholderGroups();
  const stakeholdersAndGroupsItems = useMemo(
    () => combineAndGroupStakeholderRefs(stakeholders, stakeholderGroups),
    [stakeholders, stakeholderGroups]
  );

  return (
    <div className="pf-v5-c-form">
      <FormSection>
        <TextContent>
          <Text component="h1">
            {t("composed.selectMany", {
              what: t("terms.stakeholders").toLowerCase(),
            })}
          </Text>
          <Text component="p">{t("message.assessmentStakeholderHeader")}</Text>
        </TextContent>
      </FormSection>

      <Grid className="pf-v5-c-form__section">
        <GridItem md={6} className="pf-v5-c-form">
          <FormSection>
            <HookFormAutocomplete<AssessmentWizardValues>
              items={stakeholdersAndGroupsItems}
              control={control}
              name="stakeholdersAndGroupsRefs"
              label="Stakeholder(s) and Stakeholder Group(s)"
              fieldId="stakeholdersAndGroups"
              noResultsMessage={t("message.noResultsFoundTitle")}
              placeholderText={t("composed.selectMany", {
                what: t("terms.stakeholder(s)").toLowerCase(),
              })}
              isGrouped
              isRequired
              searchInputAriaLabel="stakeholders-and-groups-select-toggle"
            />
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};

const createCompositeKey = (group: string, id: number) => `${group}:${id}`;

export const combineAndGroupStakeholderRefs = (
  stakeholderRefs: Ref[],
  stakeholderGroupRefs: Ref[]
) => {
  const groupedRefs: GroupedStakeholderRef[] = [
    ...stakeholderRefs.map((ref) => ({
      ...ref,
      uniqueId: createCompositeKey("Stakeholder", ref.id),
      group: StakeholderType.Stakeholder,
    })),
    ...stakeholderGroupRefs.map((ref) => ({
      ...ref,
      uniqueId: createCompositeKey("Stakeholder Group", ref.id),
      group: StakeholderType.StakeholderGroup,
    })),
  ];

  return groupedRefs;
};
