import React from "react";
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
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { ApplicationAssessmentWizardValues } from "../application-assessment-wizard/application-assessment-wizard";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { Stakeholder, StakeholderGroup } from "@app/api/models";

const stakeholderGroupToOption = (
  value: StakeholderGroup
): OptionWithValue<StakeholderGroup> => ({
  value,
  toString: () => value.name,
});

const stakeholderToOption = (
  value: Stakeholder
): OptionWithValue<Stakeholder> => ({
  value,
  toString: () => value.name,
  props: {
    description: value.email,
  },
});

export const AssessmentStakeholdersForm: React.FC = () => {
  const { t } = useTranslation();
  const { setValue, control, formState } =
    useFormContext<ApplicationAssessmentWizardValues>();

  const { stakeholders } = useFetchStakeholders();

  const { stakeholderGroups } = useFetchStakeholderGroups();

  // Identity dropdown
  return (
    <div className="pf-c-form">
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

      <Grid className="pf-c-form__section">
        <GridItem md={6} className="pf-c-form">
          <FormSection>
            <HookFormPFGroupController
              control={control}
              name="stakeholders"
              label={t("terms.stakeholders")}
              fieldId="stakeholders"
              renderInput={({ field: { value, name, onChange } }) => (
                <SimpleSelect
                  id="stakeholders-select"
                  variant="typeaheadmulti"
                  toggleId="stakeholders-select-toggle"
                  toggleAriaLabel="Stakeholders dropdown toggle"
                  aria-label={name}
                  value={value
                    .map((id) => stakeholders.find((f) => id === f.id))
                    .map((e) => (e ? stakeholderToOption(e) : undefined))
                    .filter((e) => e !== undefined)}
                  options={stakeholders.map(stakeholderToOption)}
                  onChange={(selection) => {
                    const selectionWithValue =
                      selection as OptionWithValue<Stakeholder>;
                    const selectionId: number = selectionWithValue.value.id!;

                    const currentValue = value || [];
                    const e = currentValue.find((f) => f === selectionId);
                    if (e) {
                      onChange(currentValue.filter((f) => f !== selectionId));
                    } else {
                      onChange([...currentValue, selectionId]);
                    }
                  }}
                  onClear={() => onChange([])}
                  noResultsFoundText={t("message.noResultsFoundTitle")}
                />
              )}
            />
            <HookFormPFGroupController
              control={control}
              name="stakeholderGroups"
              label={t("terms.stakeholderGroups")}
              fieldId="stakeholder-groups"
              renderInput={({ field: { value, name, onChange } }) => (
                <SimpleSelect
                  variant="typeaheadmulti"
                  id="stakeholder-groups-select"
                  toggleId="stakeholder-groups-select-toggle"
                  toggleAriaLabel="Stakeholder groups dropdown toggle"
                  aria-label={name}
                  value={value
                    .map((id) => stakeholderGroups.find((f) => id === f.id))
                    .map((e) => (e ? stakeholderGroupToOption(e) : undefined))
                    .filter((e) => e !== undefined)}
                  options={stakeholderGroups.map(stakeholderGroupToOption)}
                  onChange={(selection) => {
                    const selectionWithValue =
                      selection as OptionWithValue<StakeholderGroup>;
                    const selectionId: number = selectionWithValue.value.id!;

                    const currentValue = value || [];
                    const e = currentValue.find((f) => f === selectionId);
                    if (e) {
                      onChange(currentValue.filter((f) => f !== selectionId));
                    } else {
                      onChange([...currentValue, selectionId]);
                    }
                  }}
                  onClear={() => onChange([])}
                  noResultsFoundText={t("message.noResultsFoundTitle")}
                />
              )}
            />
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};
