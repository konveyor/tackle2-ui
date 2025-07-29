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

      <div
        style={{
          backgroundColor: "#f0f8ff",
          padding: "1rem",
          borderRadius: "4px",
          border: "1px solid #cce7ff",
          marginBottom: "1rem",
        }}
      >
        <Text component="p" style={{ fontWeight: "bold", color: "#0066cc" }}>
          ⚠️ Development Mode
        </Text>
        <Text component="p" style={{ fontSize: "0.9rem", color: "#555" }}>
          This wizard is currently in development mode. The asset generation
          task will be logged but not executed until backend support is
          implemented.
        </Text>
      </div>

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
