import React, { useMemo } from "react";
import {
  Title,
  Text,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";
import { useFormContext, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { AssetGenerationWizardFormValues } from "./schema";
import { useFetchTargets } from "@app/queries/targets";
import { useFetchArchetypes } from "@app/queries/archetypes";

interface SetTargetProfileProps {
  applications: Application[];
}

export const SetTargetProfile: React.FC<SetTargetProfileProps> = ({
  applications,
}) => {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<AssetGenerationWizardFormValues>();

  const {
    targets,
    isFetching: isTargetsLoading,
    fetchError: targetsError,
  } = useFetchTargets();
  const {
    archetypes,
    isFetching: isArchetypesLoading,
    error: archetypesError,
  } = useFetchArchetypes();

  // Get union of all target profiles from application archetypes
  const availableTargetProfiles = useMemo(() => {
    if (!applications || !archetypes || !targets) {
      return [];
    }

    const archetypeIds = new Set(
      applications.flatMap(
        (app) => app.archetypes?.map((archetype) => archetype.id) || []
      )
    );

    const applicableTargets = targets.filter((target) =>
      archetypes.some(
        (archetype) =>
          archetypeIds.has(archetype.id) &&
          archetype.applications?.some((app) =>
            applications.some((a) => a.id === app.id)
          )
      )
    );

    return applicableTargets;
  }, [applications, archetypes, targets]);

  // Debug logging
  console.log("SetTargetProfile - applications:", applications);
  console.log("SetTargetProfile - targets:", targets);
  console.log("SetTargetProfile - archetypes:", archetypes);
  console.log(
    "SetTargetProfile - availableTargetProfiles:",
    availableTargetProfiles
  );

  if (targetsError || archetypesError) {
    console.error("API Errors:", { targetsError, archetypesError });
  }

  return (
    <Form>
      <Title headingLevel="h3" size="xl">
        {t("wizard.terms.setTargetProfile")}
      </Title>
      <Text>{t("wizard.terms.setTargetProfileDescription")}</Text>

      {(targetsError || archetypesError) && (
        <Text component="p" style={{ color: "red" }}>
          Error loading data. Please check console for details.
        </Text>
      )}

      <FormGroup
        label={t("terms.targetProfile")}
        fieldId="target-profile-select"
      >
        <Controller
          control={control}
          name="selectedTargetProfile"
          render={({ field: { onChange, value } }) => (
            <FormSelect
              id="target-profile-select"
              value={value?.id || ""}
              onChange={(_, selectedId) => {
                const selectedTarget = availableTargetProfiles.find(
                  (target) => target.id.toString() === selectedId
                );
                onChange(selectedTarget || null);
              }}
              aria-label={t("terms.targetProfile")}
            >
              <FormSelectOption
                value=""
                label={t("actions.selectOneOptional", {
                  what: "target profile",
                })}
              />
              {availableTargetProfiles.map((target) => (
                <FormSelectOption
                  key={target.id}
                  value={target.id.toString()}
                  label={target.name}
                />
              ))}
            </FormSelect>
          )}
        />
      </FormGroup>

      {availableTargetProfiles.length === 0 &&
        !isTargetsLoading &&
        !isArchetypesLoading && (
          <Text component="p">{t("message.noTargetProfilesAvailable")}</Text>
        )}

      <Text component="p" style={{ marginTop: "1rem", fontStyle: "italic" }}>
        Target profile selection is optional. You can proceed without selecting
        one.
      </Text>

      <Text component="p" style={{ color: "green", marginTop: "0.5rem" }}>
        ✓ Ready to proceed to next step
      </Text>
    </Form>
  );
};
