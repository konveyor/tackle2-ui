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
import ItemsSelect from "@app/components/items-select/items-select";
import { AssessmentWizardValues } from "../assessment-wizard/assessment-wizard";

export const AssessmentStakeholdersForm: React.FC = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<AssessmentWizardValues>();

  const { stakeholders } = useFetchStakeholders();
  const { stakeholderGroups } = useFetchStakeholderGroups();

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
            <ItemsSelect
              items={stakeholders}
              control={control}
              name="stakeholders"
              label="Stakeholder(s)"
              fieldId="stakeholders"
              noResultsMessage={t("message.noResultsFoundTitle")}
              placeholderText={t("composed.selectMany", {
                what: t("terms.stakeholder(s)").toLowerCase(),
              })}
              searchInputAriaLabel="stakeholder-select-toggle"
            />

            <ItemsSelect
              items={stakeholderGroups}
              control={control}
              name="stakeholderGroups"
              label="Stakeholder Group(s)"
              fieldId="stakeholderGroups"
              noResultsMessage={t("message.noResultsFoundTitle")}
              placeholderText={t("composed.selectMany", {
                what: t("terms.stakeholderGroup(s)").toLowerCase(),
              })}
              searchInputAriaLabel="stakeholder-groups-select-toggle"
            />
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};
