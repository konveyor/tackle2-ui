import { useMemo } from "react";
import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextArea,
  Title,
} from "@patternfly/react-core";

import type { MigratorConfig, New, Ref } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchIdentities } from "@app/queries/identities";
import {
  useCreateMigratorMutation,
  useFetchMigrators,
  useUpdateMigratorMutation,
} from "@app/queries/migrators";
import { matchItemsToRef } from "@app/utils/model-utils";
import { duplicateNameCheck, getAxiosErrorMessage } from "@app/utils/utils";

export interface MigratorFormValues {
  name: string;
  description?: string;
  sourceRepoUrl: string;
  sourceBranch: string;
  sourceCredentials?: string;
  assetRepoUrl: string;
  assetBranch: string;
  assetCredentials?: string;
  migrationTarget?: string;
  palletYaml?: string;
}

export interface MigratorFormProps {
  migrator?: MigratorConfig | null;
  onClose: () => void;
}

const MIGRATION_TARGETS = ["quarkus", "spring-boot", "liberty", "eap"];

export const MigratorForm: React.FC<MigratorFormProps> = ({ ...rest }) => {
  const { isDataReady } = useMigratorFormData();
  return (
    <ConditionalRender when={!isDataReady} then={<AppPlaceholder />}>
      <MigratorFormRenderer {...rest} />
    </ConditionalRender>
  );
};

const MigratorFormRenderer: React.FC<MigratorFormProps> = ({
  migrator = null,
  onClose,
}) => {
  const { t } = useTranslation();

  const {
    existingMigrators,
    identities,
    createMigrator,
    updateMigrator,
    identityToRef,
  } = useMigratorFormData({
    onActionSuccess: onClose,
  });

  const identityOptions: FilterSelectOptionProps[] = useMemo(
    () =>
      (identities || []).map((id) => ({
        value: id.name,
        label: id.name,
      })),
    [identities]
  );

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        name: yup
          .string()
          .trim()
          .required(t("validation.required"))
          .min(3, t("validation.minLength", { length: 3 }))
          .max(120, t("validation.maxLength", { length: 120 }))
          .test(
            "Duplicate name",
            t("validation.duplicateName", { type: "migrator" }),
            (value) =>
              existingMigrators
                ? duplicateNameCheck(existingMigrators, migrator, value ?? "")
                : false
          ),
        description: yup
          .string()
          .trim()
          .max(250, t("validation.maxLength", { length: 250 })),
        sourceRepoUrl: yup.string().trim().required(t("validation.required")),
        sourceBranch: yup
          .string()
          .trim()
          .max(100, t("validation.maxLength", { length: 100 })),
        sourceCredentials: yup.string().trim().nullable(),
        assetRepoUrl: yup.string().trim().required(t("validation.required")),
        assetBranch: yup.string().trim().required(t("validation.required")),
        assetCredentials: yup.string().trim().nullable(),
        migrationTarget: yup.string().trim(),
        palletYaml: yup.string().trim(),
      }),
    [t, existingMigrators, migrator]
  );

  const defaultValues = useMemo(
    () =>
      !migrator
        ? {
            name: "",
            description: "",
            sourceRepoUrl: "",
            sourceBranch: "main",
            sourceCredentials: "",
            assetRepoUrl: "",
            assetBranch: "migration-output",
            assetCredentials: "",
            migrationTarget: "",
            palletYaml: "",
          }
        : {
            name: migrator.name,
            description: migrator.description || "",
            sourceRepoUrl: migrator.sourceRepository?.url || "",
            sourceBranch: migrator.sourceRepository?.branch || "main",
            sourceCredentials: migrator.sourceRepository?.identity?.name || "",
            assetRepoUrl: migrator.assetRepository?.url || "",
            assetBranch: migrator.assetRepository?.branch || "",
            assetCredentials: migrator.assetRepository?.identity?.name || "",
            migrationTarget: migrator.migrationTarget || "",
            palletYaml: migrator.pallet?.yaml || "",
          },
    [migrator]
  );

  const formMethods = useForm<MigratorFormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = formMethods;

  const onValidSubmit = (values: MigratorFormValues) => {
    const payload: New<MigratorConfig> = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      sourceRepository: {
        url: values.sourceRepoUrl.trim(),
        branch: values.sourceBranch?.trim() || "main",
        identity: identityToRef(values.sourceCredentials),
      },
      assetRepository: {
        url: values.assetRepoUrl.trim(),
        branch: values.assetBranch.trim(),
        identity: identityToRef(values.assetCredentials),
      },
      migrationTarget: values.migrationTarget?.trim() || undefined,
      pallet: values.palletYaml?.trim()
        ? { yaml: values.palletYaml.trim() }
        : undefined,
    };

    if (migrator) {
      updateMigrator({
        id: migrator.id,
        ...payload,
      });
    } else {
      createMigrator(payload);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Form onSubmit={handleSubmit(onValidSubmit)} id="migrator-form">
        <HookFormPFTextInput
          control={control}
          name="name"
          label={t("terms.name")}
          fieldId="migrator-name"
          isRequired
        />

        <HookFormPFTextInput
          control={control}
          name="description"
          label={t("terms.description")}
          fieldId="migrator-description"
        />

        <HookFormPFGroupController
          control={control}
          name="migrationTarget"
          label="Migration Target"
          fieldId="migrator-migration-target"
          renderInput={({ field: { value, name, onChange } }) => (
            <TypeaheadSelect
              placeholderText="Select a migration target..."
              toggleId="migration-target-toggle"
              toggleAriaLabel="Migration target select dropdown toggle"
              ariaLabel={name}
              value={value}
              options={MIGRATION_TARGETS.map(
                (t): FilterSelectOptionProps => ({ value: t, label: t })
              )}
              onSelect={(selection) => onChange(selection ?? "")}
            />
          )}
        />

        {/* Source Repository Section */}
        <Title headingLevel="h3" size="md" style={{ marginTop: 16 }}>
          Source Repository
        </Title>

        <HookFormPFTextInput
          control={control}
          name="sourceRepoUrl"
          label="Repository URL"
          fieldId="migrator-source-repo-url"
          isRequired
        />

        <HookFormPFTextInput
          control={control}
          name="sourceBranch"
          label="Branch"
          fieldId="migrator-source-branch"
        />

        <HookFormPFGroupController
          control={control}
          name="sourceCredentials"
          label="Credentials"
          fieldId="migrator-source-credentials"
          renderInput={({ field: { value, name, onChange } }) => (
            <TypeaheadSelect
              placeholderText="Select credentials..."
              toggleId="source-credentials-toggle"
              toggleAriaLabel="Source credentials select dropdown toggle"
              ariaLabel={name}
              value={value}
              options={identityOptions}
              onSelect={(selection) => onChange(selection ?? "")}
            />
          )}
        />

        {/* Asset Repository Section */}
        <Title headingLevel="h3" size="md" style={{ marginTop: 16 }}>
          Asset Repository
        </Title>

        <HookFormPFTextInput
          control={control}
          name="assetRepoUrl"
          label="Repository URL"
          fieldId="migrator-asset-repo-url"
          isRequired
        />

        <HookFormPFTextInput
          control={control}
          name="assetBranch"
          label="Output Branch"
          fieldId="migrator-asset-branch"
          isRequired
        />

        <HookFormPFGroupController
          control={control}
          name="assetCredentials"
          label="Credentials"
          fieldId="migrator-asset-credentials"
          renderInput={({ field: { value, name, onChange } }) => (
            <TypeaheadSelect
              placeholderText="Select credentials..."
              toggleId="asset-credentials-toggle"
              toggleAriaLabel="Asset credentials select dropdown toggle"
              ariaLabel={name}
              value={value}
              options={identityOptions}
              onSelect={(selection) => onChange(selection ?? "")}
            />
          )}
        />

        {/* Pallet YAML Section */}
        <HookFormPFGroupController
          control={control}
          name="palletYaml"
          label="Pallet YAML"
          fieldId="migrator-pallet-yaml"
          renderInput={({ field: { value, onChange } }) => (
            <FormGroup fieldId="migrator-pallet-yaml-input">
              <TextArea
                id="migrator-pallet-yaml-input"
                value={value}
                onChange={(_event, val) => onChange(val)}
                aria-label="Pallet YAML"
                rows={8}
                resizeOrientation="vertical"
                placeholder={`# Define your pallet configuration\nskills:\n  - java-ee-to-quarkus\narchetype: default`}
                style={{ fontFamily: "monospace", fontSize: "0.85em" }}
              />
            </FormGroup>
          )}
        />

        <ActionGroup>
          <Button
            type="submit"
            id="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
          >
            {!migrator ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            id="cancel"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={isSubmitting || isValidating}
            onClick={onClose}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormProvider>
  );
};

const useMigratorFormData = ({
  onActionSuccess,
  onActionFail,
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
} = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { identities, isSuccess: isIdentitiesSuccess } = useFetchIdentities();
  const { migrators: existingMigrators, isSuccess: isMigratorsSuccess } =
    useFetchMigrators();

  const onCreateSuccess = () => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.new"),
        what: "migrator",
      }),
      variant: "success",
    });
    onActionSuccess?.();
  };

  const onUpdateSuccess = (_id: number) => {
    pushNotification({
      title: t("toastr.success.save", {
        type: "migrator",
      }),
      variant: "success",
    });
    onActionSuccess?.();
  };

  const onCreateUpdateError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail?.();
  };

  const { mutate: createMigrator } = useCreateMigratorMutation(
    onCreateSuccess,
    onCreateUpdateError
  );

  const { mutate: updateMigrator } = useUpdateMigratorMutation(
    onUpdateSuccess,
    onCreateUpdateError
  );

  return {
    existingMigrators,
    identities,
    isDataReady: isMigratorsSuccess && isIdentitiesSuccess,
    createMigrator,
    updateMigrator,
    identityToRef: (name?: string): Ref | undefined =>
      matchItemsToRef(identities, ({ name }) => name, name),
  };
};

export default MigratorForm;
