import React from "react";
import {
  Title,
  Text,
  Form,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListDescription,
  DescriptionListGroup,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { AssetGenerationWizardFormValues } from "./schema";

export const Review: React.FC = () => {
  const { t } = useTranslation();
  const { watch } = useFormContext<AssetGenerationWizardFormValues>();

  const formValues = watch();

  return (
    <Form>
      <Title headingLevel="h3" size="xl">
        {t("wizard.terms.review")}
      </Title>
      <Text>{t("wizard.terms.reviewDescription")}</Text>

      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.applications")}</DescriptionListTerm>
          <DescriptionListDescription>
            {formValues.selectedApplications?.length || 0} selected:
            <ul>
              {formValues.selectedApplications?.map((app) => (
                <li key={app.id}>{app.name}</li>
              ))}
            </ul>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.targetProfile")}</DescriptionListTerm>
          <DescriptionListDescription>
            {formValues.selectedTargetProfile?.name || t("terms.notSelected")}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>{t("terms.generator")}</DescriptionListTerm>
          <DescriptionListDescription>
            {formValues.selectedGenerator?.name || t("terms.notSelected")}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </Form>
  );
};
