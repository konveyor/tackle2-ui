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
        "A target profile with this name already exists.",
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
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
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
            type="submit"
            variant="primary"
            isDisabled={!isValid || isGeneratorsLoading}
            isLoading={isGeneratorsLoading}
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
