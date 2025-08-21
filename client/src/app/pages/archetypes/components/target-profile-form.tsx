import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalVariant,
  Form,
  ActionGroup,
  DualListSelector,
} from "@patternfly/react-core";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import type { TargetProfile, Generator, Archetype } from "@app/api/models";
import { toRefs } from "@app/utils/model-utils";
import { useFetchGenerators } from "@app/queries/generators";
import { duplicateNameCheck } from "@app/utils/utils";
import { fork } from "radash";

interface TargetProfileFormValues {
  name: string;
  generators: Generator[];
}

interface TargetProfileFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (profile: TargetProfile) => void;
  archetype: Archetype;
  profile?: TargetProfile | null;
}

const TargetProfileForm: React.FC<TargetProfileFormProps> = ({
  isOpen,
  onCancel,
  onSave,
  archetype,
  profile = null,
}) => {
  const { t } = useTranslation();
  const { generators } = useFetchGenerators();

  // Dual list selector state
  const [availableOptions, setAvailableOptions] = useState<Generator[]>([]);
  const [chosenOptions, setChosenOptions] = useState<Generator[]>([]);

  // Initialize dual list selector options when modal opens
  React.useEffect(() => {
    if (isOpen && generators) {
      if (!profile) {
        setAvailableOptions(generators);
        setChosenOptions([]);
      } else {
        const [chosen, available] = fork(generators, (g) =>
          profile.generators?.some((ref) => ref.id === g.id)
        );
        setAvailableOptions(available);
        setChosenOptions(chosen);
      }
    }
  }, [isOpen, profile, generators]);

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
        (value) =>
          duplicateNameCheck(archetype.profiles ?? [], profile, value ?? "")
      ),
    generators: yup
      .array()
      .of(yup.object({ id: yup.number(), name: yup.string() }))
      .min(1, ({ min }) =>
        t("validation.minCount", {
          count: min,
          type: t("terms.generator"),
          types: t("terms.generators"),
        })
      ),
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isValid },
  } = useForm<TargetProfileFormValues>({
    defaultValues: {
      name: profile?.name ?? "",
      generators: profile?.generators ?? [],
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onListChange = useCallback(
    (
      _event: React.MouseEvent,
      newAvailableOptions: React.ReactNode[],
      newChosenOptions: React.ReactNode[]
    ) => {
      const newAvailable = newAvailableOptions
        .map((node) => node?.toString())
        .map((name) => generators.find((g) => g.name === name))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      const newChosen = newChosenOptions
        .map((node) => node?.toString())
        .map((name) => generators.find((g) => g.name === name))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableOptions(newAvailable);
      setChosenOptions(newChosen);
      setValue("generators", newChosen, { shouldValidate: true });
    },
    [generators, setValue]
  );

  const submitToOnSave = (values: TargetProfileFormValues) => {
    if (!generators) return;

    const newProfile: TargetProfile = {
      id: profile?.id ?? 0,
      name: values.name,
      generators: toRefs(chosenOptions),
    };

    onSave(newProfile);
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={
        profile
          ? t("dialog.title.updateTargetProfile")
          : t("dialog.title.newTargetProfile")
      }
      isOpen={isOpen}
      onClose={onCancel}
      onEscapePress={onCancel}
    >
      <Form onSubmit={handleSubmit(submitToOnSave)}>
        <HookFormPFTextInput
          control={control}
          name="name"
          label={t("terms.name")}
          fieldId="target-profile-name"
          isRequired
        />

        <HookFormPFGroupController
          control={control}
          name="generators"
          label={t("terms.generators")}
          fieldId="target-profile-generators"
          isRequired
          renderInput={() => (
            <DualListSelector
              availableOptions={availableOptions.map(({ name }) => name)}
              chosenOptions={chosenOptions.map(({ name }) => name)}
              onListChange={onListChange}
              id="target-profile-generators-selector"
              availableOptionsTitle={t("message.generatorsAvailable")}
              chosenOptionsTitle={t("message.generatorsChosen")}
            />
          )}
        />

        <ActionGroup>
          <Button
            type="button"
            variant="primary"
            isDisabled={!isValid}
            onClick={handleSubmit(submitToOnSave)}
          >
            {profile ? t("actions.save") : t("actions.create")}
          </Button>
          <Button variant="link" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </Modal>
  );
};

export default TargetProfileForm;
