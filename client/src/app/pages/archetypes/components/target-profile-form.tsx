import { useCallback, useState } from "react";
import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  DualListSelector,
  Form,
  Modal,
  ModalVariant,
  Spinner,
} from "@patternfly/react-core";

import type {
  AnalysisProfile,
  Archetype,
  Generator,
  TargetProfile,
} from "@app/api/models";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { useFetchGenerators } from "@app/queries/generators";
import { refsToItems, toRef, toRefs } from "@app/utils/model-utils";
import { duplicateNameCheck } from "@app/utils/utils";

import { useAnalysisProfileOptions } from "../hooks/useAnalysisProfileOptions";

interface TargetProfileFormValues {
  name: string;
  generators: Generator[];
  analysisProfile: AnalysisProfile | null;
}

interface TargetProfileFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (profile: TargetProfile) => void;
  archetype: Archetype;
  profile?: TargetProfile | null;
}

interface TargetProfileFormPropsInner extends TargetProfileFormProps {
  generators: Generator[];
  analysisProfileOptions: OptionWithValue<AnalysisProfile>[];
  findProfileById: (id: number | undefined) => AnalysisProfile | undefined;
}

const TargetProfileForm: React.FC<TargetProfileFormProps> = (props) => {
  const { generators, isLoading: isGeneratorsLoading } = useFetchGenerators();
  const {
    analysisProfileOptions,
    findProfileById,
    isFetching: isAnalysisProfilesLoading,
  } = useAnalysisProfileOptions();

  if (isGeneratorsLoading || isAnalysisProfilesLoading) {
    return <Spinner aria-label="Loading generators and analysis profiles" />;
  }

  return (
    <TargetProfileFormInner
      {...props}
      generators={generators}
      analysisProfileOptions={analysisProfileOptions}
      findProfileById={findProfileById}
    />
  );
};

const TargetProfileFormInner: React.FC<TargetProfileFormPropsInner> = ({
  isOpen,
  onCancel,
  onSave,
  archetype,
  profile = null,
  generators,
  analysisProfileOptions,
  findProfileById,
}) => {
  const { t } = useTranslation();

  // Dual list selector state
  const [availableOptions, setAvailableOptions] = useState<Generator[]>(() => {
    if (profile) {
      return generators.filter(
        (g) => !profile.generators.some((r) => r.id === g.id)
      );
    }
    return generators;
  });
  const [chosenOptions, setChosenOptions] = useState<Generator[]>(() => {
    if (profile) {
      return refsToItems(generators, profile.generators);
    }
    return [];
  });

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
      .of(yup.object({ id: yup.number(), name: yup.string() })),
    analysisProfile: yup
      .object()
      .shape({ id: yup.number(), name: yup.string() })
      .nullable(),
  });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { isValid },
  } = useForm<TargetProfileFormValues>({
    defaultValues: {
      name: profile?.name ?? "",
      generators: refsToItems(generators, profile?.generators),
      analysisProfile: findProfileById(profile?.analysisProfile?.id) ?? null,
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
      analysisProfile: toRef(values.analysisProfile ?? undefined),
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

        <HookFormPFGroupController
          control={control}
          name="analysisProfile"
          label={t("terms.analysisProfile")}
          fieldId="target-profile-analysis-profile"
          renderInput={({ field: { value, onChange } }) => (
            <SimpleSelect
              id="analysis-profile-select"
              toggleId="analysis-profile-select-toggle"
              variant="typeahead"
              placeholderText={t("composed.selectOne", {
                what: t("terms.analysisProfile").toLowerCase(),
              })}
              toggleAriaLabel="Analysis profile select"
              aria-label="Select analysis profile"
              value={
                value
                  ? analysisProfileOptions.find((o) => o.value.id === value.id)
                  : undefined
              }
              options={analysisProfileOptions}
              onChange={(selection) => {
                const selected = selection as OptionWithValue<AnalysisProfile>;
                onChange(selected?.value ?? null);
              }}
              onClear={() => onChange(null)}
            />
          )}
        />

        <ActionGroup>
          <Button
            type="button"
            id="submit"
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
