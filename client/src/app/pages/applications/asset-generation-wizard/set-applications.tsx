import React from "react";
import { Title, Text, Form, FormGroup } from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { AssetGenerationWizardFormValues } from "./schema";

interface SetApplicationsProps {
  applications: Application[];
}

export const SetApplications: React.FC<SetApplicationsProps> = ({
  applications,
}) => {
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<AssetGenerationWizardFormValues>();

  const selectedApplications = watch("selectedApplications");

  // Use applications from props if form doesn't have them yet
  const displayApplications =
    selectedApplications && selectedApplications.length > 0
      ? selectedApplications
      : applications;

  // Ensure form is synced with the applications prop
  React.useEffect(() => {
    if (
      applications &&
      applications.length > 0 &&
      (!selectedApplications || selectedApplications.length === 0)
    ) {
      console.log("Syncing applications to form:", applications);
      setValue("selectedApplications", applications);
    }
  }, [applications, selectedApplications, setValue]);

  return (
    <Form>
      <Title headingLevel="h3" size="xl">
        {t("wizard.terms.setApplications")}
      </Title>
      <Text>{t("wizard.terms.setApplicationsDescription")}</Text>

      <FormGroup fieldId="selected-applications">
        <div>
          <Text component="p">
            Selected applications ({displayApplications?.length || 0}):
          </Text>
          {displayApplications && displayApplications.length > 0 ? (
            <ul>
              {displayApplications.map((app) => (
                <li key={app.id}>{app.name}</li>
              ))}
            </ul>
          ) : (
            <Text component="p" style={{ color: "red", fontStyle: "italic" }}>
              No applications selected. Please select at least one application
              to proceed.
            </Text>
          )}
        </div>
      </FormGroup>

      {displayApplications && displayApplications.length > 0 && (
        <Text component="p" style={{ color: "green", marginTop: "1rem" }}>
          ✓ Ready to proceed to next step
        </Text>
      )}
    </Form>
  );
};
