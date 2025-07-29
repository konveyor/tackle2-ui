import React from "react";
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

import { Target } from "@app/api/models";
import { AssetGenerationWizardFormValues } from "./schema";
import { useFetchGenerators } from "@app/queries/generators";

interface SetGeneratorProps {
  targetProfile: Target | null;
}

export const SetGenerator: React.FC<SetGeneratorProps> = ({
  targetProfile,
}) => {
  const { t } = useTranslation();
  const {
    control,
    formState: { errors },
  } = useFormContext<AssetGenerationWizardFormValues>();

  const { generators, isLoading: isGeneratorsLoading } = useFetchGenerators();

  return (
    <Form>
      <Title headingLevel="h3" size="xl">
        {t("wizard.terms.setGenerator")}
      </Title>
      <Text>{t("wizard.terms.setGeneratorDescription")}</Text>

      {targetProfile && (
        <Text component="p">
          <strong>{t("terms.selectedTargetProfile")}:</strong>{" "}
          {targetProfile.name}
        </Text>
      )}

      <FormGroup label={t("terms.generator")} fieldId="generator-select">
        <Controller
          control={control}
          name="selectedGenerator"
          render={({ field: { onChange, value } }) => (
            <FormSelect
              id="generator-select"
              value={value?.id || ""}
              onChange={(_, selectedId) => {
                const selectedGenerator = generators?.find(
                  (generator) => generator.id.toString() === selectedId
                );
                onChange(selectedGenerator || null);
              }}
              aria-label={t("terms.generator")}
            >
              <FormSelectOption
                value=""
                label={t("actions.selectOneOptional", { what: "generator" })}
              />
              {(generators || []).map((generator) => (
                <FormSelectOption
                  key={generator.id}
                  value={generator.id.toString()}
                  label={generator.name}
                />
              ))}
            </FormSelect>
          )}
        />
      </FormGroup>

      {(generators || []).length === 0 && !isGeneratorsLoading && (
        <Text component="p">{t("message.noGeneratorsAvailable")}</Text>
      )}

      <Text component="p" style={{ marginTop: "1rem", fontStyle: "italic" }}>
        Generator selection is optional. You can proceed without selecting one.
      </Text>

      <Text component="p" style={{ color: "green", marginTop: "0.5rem" }}>
        ✓ Ready to proceed to next step
      </Text>
    </Form>
  );
};
