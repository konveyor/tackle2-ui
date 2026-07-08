import { useCallback, useState } from "react";
import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";

import type {
  AnalysisProfile,
  Archetype,
  Generator,
  TargetProfile,
} from "@app/api/models";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { useFetchGenerators } from "@app/queries/generators";
import { refsToItems, toRef, toRefs } from "@app/utils/model-utils";
import { duplicateNameCheck } from "@app/utils/utils";

import { DualListSelector } from "../../../components/dual-list-selector";
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
  analysisProfileOptions: FilterSelectOptionProps[];
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

  const submitToOnSave = (values: TargetProfileFormValues) => {
    if (!generators) return;

    const newProfile: TargetProfile = {
      id: profile?.id ?? 0,
      name: values.name,
      generators: toRefs(values.generators),
      analysisProfile: toRef(values.analysisProfile ?? undefined),
    };

    onSave(newProfile);
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={onCancel}
      onEscapePress={onCancel}
    >
      <ModalHeader
        title={
          profile
            ? t("dialog.title.updateTargetProfile")
            : t("dialog.title.newTargetProfile")
        }
      />
      <ModalBody>
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
            renderInput={({ field: { value: chosenGenerators, onChange } }) => (
              <DualListSelector
                allOptions={generators.map(({ name }) => name)}
                chosenOptions={chosenGenerators?.map(({ name }) => name) ?? []}
                onChange={(newGenerators) =>
                  onChange(
                    generators.filter((g) => newGenerators.includes(g.name))
                  )
                }
                allOptionsTitle={t("message.generatorsAvailable")}
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
              <TypeaheadSelect
                toggleId="analysis-profile-select-toggle"
                placeholderText={t("composed.selectOne", {
                  what: t("terms.analysisProfile").toLowerCase(),
                })}
                toggleAriaLabel="Analysis profile select"
                ariaLabel="Select analysis profile"
                value={value ? value?.id.toString() : undefined}
                options={analysisProfileOptions}
                onSelect={(selectedId) =>
                  onChange(
                    selectedId
                      ? (findProfileById(Number(selectedId)) ?? null)
                      : null
                  )
                }
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
      </ModalBody>
    </Modal>
  );
};

export default TargetProfileForm;
