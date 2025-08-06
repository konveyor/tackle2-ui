import React, { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalVariant,
  Form,
  ActionGroup,
  Alert,
  AlertVariant,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { TargetProfile, Generator } from "@app/api/models";
import {
  HookFormPFTextInput,
  HookFormAutocomplete,
} from "@app/components/HookFormPFFields";
import { useFetchGenerators } from "@app/queries/generators";
import { matchItemsToRefs } from "@app/utils/model-utils";

export interface TargetProfileFormValues {
  name: string;
  generators: Generator[];
}

export interface TargetProfileFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (profile: TargetProfile) => void;
  initialProfile?: TargetProfile;
  existingNames?: string[];
}

/**
 * Target Profile Form Component
 *
 * This form is used to create/edit target profiles within the archetype form.
 * It does NOT submit directly to the backend - instead it updates the local
 * state of the parent archetype form. The target profiles will be submitted
 * to the backend only when the parent archetype form is submitted.
 */
export const TargetProfileForm: React.FC<TargetProfileFormProps> = ({
  isOpen,
  onCancel,
  onSave,
  initialProfile,
  existingNames = [],
}) => {
  const { t } = useTranslation();
  const {
    generators,
    isLoading: isGeneratorsLoading,
    fetchError: generatorsError,
  } = useFetchGenerators();

  const validationSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "unique-name",
        t("validation.duplicateTargetProfileName"),
        (value) => {
          if (!value) return false;
          const existingNamesList = initialProfile
            ? existingNames.filter((name) => name !== initialProfile.name)
            : existingNames;
          return !existingNamesList.includes(value.trim());
        }
      ),
    generators: yup.array().min(1, t("validation.required")),
  });

  const defaultValues = useMemo(
    () => ({
      name: initialProfile?.name || "",
      generators:
        initialProfile?.generators && generators
          ? generators.filter((g) =>
              initialProfile.generators.some((ref) => ref.id === g.id)
            )
          : [],
    }),
    [initialProfile, generators]
  );

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
  } = useForm<TargetProfileFormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema),
    mode: "onBlur",
  });

  /**
   * Handle form submission
   * This only updates the local state of the parent archetype form.
   * The actual backend submission happens when the archetype form is submitted.
   * Uses manual submission to prevent interfering with parent form.
   */
  const onSubmit = useCallback(
    (values: TargetProfileFormValues) => {
      const profile: TargetProfile = {
        id: initialProfile?.id,
        name: values.name.trim(),
        generators:
          matchItemsToRefs(
            generators || [],
            (g) => g.id,
            values.generators.map((g) => g.id)
          ) || [],
      };

      // Update parent form's local state only - no backend submission
      onSave(profile);
      reset();
      onCancel();
    },
    [initialProfile?.id, generators, onSave, reset, onCancel]
  );

  const handleCancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  return (
    <Modal
      variant={ModalVariant.medium}
      title={
        initialProfile
          ? t("actions.edit", { what: t("terms.targetProfile") })
          : t("actions.create", { what: t("terms.targetProfile") })
      }
      isOpen={isOpen}
      onClose={handleCancel}
      onEscapePress={handleCancel}
    >
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(onSubmit)(e);
        }}
      >
        {generatorsError && (
          <Alert
            variant={AlertVariant.danger}
            title={t("message.errorFetchingGenerators")}
            className="pf-v5-u-mb-md"
          />
        )}

        <HookFormPFTextInput
          control={control}
          name="name"
          label={t("terms.name")}
          fieldId="target-profile-name"
          isRequired
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />

        <HookFormAutocomplete<TargetProfileFormValues>
          items={generators || []}
          control={control}
          name="generators"
          label={t("terms.generators")}
          fieldId="target-profile-generators"
          isRequired
          noResultsMessage={t("message.noResultsFoundTitle")}
          placeholderText={
            isGeneratorsLoading
              ? t("terms.loading") + "..."
              : t("composed.selectMany", {
                  what: t("terms.generators").toLowerCase(),
                })
          }
          searchInputAriaLabel="target-profile-generators-select"
        />

        <ActionGroup>
          <Button
            type="button"
            variant="primary"
            isDisabled={!isValid || isGeneratorsLoading}
            isLoading={isGeneratorsLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {initialProfile ? t("actions.save") : t("actions.create")}
          </Button>
          <Button variant="link" onClick={handleCancel}>
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </Modal>
  );
};
