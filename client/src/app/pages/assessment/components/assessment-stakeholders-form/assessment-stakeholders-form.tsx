import { useMemo } from "react";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Content,
  FormGroup,
  FormSection,
  Grid,
  GridItem,
} from "@patternfly/react-core";

import { GroupedStakeholderRef, Ref, StakeholderType } from "@app/api/models";
import { HookFormAutocomplete } from "@app/components/HookFormPFFields";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergroups";
import { useFetchStakeholders } from "@app/queries/stakeholders";

import { AssessmentWizardValues } from "../assessment-wizard/assessment-wizard";

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
    <div className="pf-v6-c-form">
      <Content>
        <Content component="h1">
          {t("composed.selectMany", {
            what: t("terms.stakeholders").toLowerCase(),
          })}
        </Content>
        <Content component="p">
          {t("message.assessmentStakeholderHeader")}
        </Content>
      </Content>

      <Grid className="pf-v6-c-form__section">
        <GridItem md={6} className="pf-v6-c-form">
          <FormSection>
            <FormGroup
              label="Stakeholder(s) and Stakeholder Group(s)"
              fieldId="stakeholdersAndGroups"
              isRequired
            >
              <HookFormAutocomplete<AssessmentWizardValues>
                isGrouped
                groupedItems={stakeholdersAndGroupsItems}
                control={control}
                name="stakeholdersAndGroupsRefs"
                label="Stakeholder(s) and Stakeholder Group(s)"
                fieldId="stakeholdersAndGroups"
                noResultsMessage={t("message.noResultsFoundTitle")}
                placeholderText={t("composed.selectMany", {
                  what: t("terms.stakeholder(s)").toLowerCase(),
                })}
                isRequired
                searchInputAriaLabel="stakeholders-and-groups-select-toggle"
              />
            </FormGroup>
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
