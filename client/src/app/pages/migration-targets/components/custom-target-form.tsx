import React, { useContext, useEffect, useState, useMemo } from "react";
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  Radio,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError, AxiosResponse } from "axios";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import defaultImage from "./default.png";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { useCreateFileMutation } from "@app/queries/targets";
import { IReadFile, New, Rule, Target, TargetLabel } from "@app/api/models";
import { getParsedLabel, parseRules } from "@app/utils/rules-utils";
import { OptionWithValue, SimpleSelect } from "@app/components/SimpleSelect";
import { toOptionLike } from "@app/utils/model-utils";
import { useFetchIdentities } from "@app/queries/identities";
import { duplicateNameCheck } from "@app/utils/utils";
import { customRulesFilesSchema } from "../../applications/analysis-wizard/schema";
import {
  useCreateTargetMutation,
  useFetchTargets,
  useUpdateTargetMutation,
} from "@app/queries/targets";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  DEFAULT_PROVIDER,
  useMigrationProviderList,
} from "../useMigrationProviderList";
import { unique } from "radash";
import { CustomRuleFilesUpload } from "@app/components/CustomRuleFilesUpload";

export interface CustomTargetFormProps {
  target?: Target | null;
  onSaved: (response: AxiosResponse<Target>) => void;
  onCancel: () => void;
}

export interface CustomTargetFormValues {
  id: number;
  name: string;
  description?: string;
  providerType?: string;
  imageID: number | null;
  customRulesFiles: IReadFile[];
  rulesKind: string;
  repositoryType?: string;
  sourceRepository?: string;
  branch?: string;
  rootPath?: string;
  associatedCredentials?: string;
}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({
  target: initialTarget,
  onSaved,
  onCancel,
}) => {
  const { pushNotification } = useContext(NotificationsContext);
  const baseProviderList = useMigrationProviderList();
  const providerList = useMemo(
    () =>
      unique([initialTarget?.provider, ...baseProviderList])
        .filter(Boolean)
        .sort(),
    [baseProviderList, initialTarget?.provider]
  );
  const providerListOptions = useMemo(
    () =>
      providerList.map((provider) => ({
        value: provider,
        toString: () => provider,
      })),
    [providerList]
  );

  const { t } = useTranslation();
  const [target, setTarget] = useState(initialTarget);
  const [imageRejectedError, setImageRejectedError] = useState<string | null>(
    null
  );

  const [imageFilename, setImageFilename] = useState("default.png");

  const repositoryTypeOptions: OptionWithValue<string>[] = [
    {
      value: "git",
      toString: () => `Git`,
    },
    {
      value: "svn",
      toString: () => `Subversion`,
    },
  ];

  const { identities } = useFetchIdentities();

  const sourceIdentityOptions = identities
    .filter((identity) => identity.kind === "source")
    .map((sourceIdentity) => {
      return {
        value: sourceIdentity.name,
        toString: () => sourceIdentity.name,
      };
    });

  const { targets } = useFetchTargets();

  const validationSchema: yup.SchemaOf<CustomTargetFormValues> = yup
    .object()
    .shape({
      id: yup.number().defined(),
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 }))
        .test(
          "Duplicate name",
          "A custom target with this name already exists. Use a different name.",
          (value) => duplicateNameCheck(targets, target || null, value || "")
        ),
      description: yup.string(),
      providerType: yup.string().oneOf(providerList),
      imageID: yup.number().defined().nullable(),
      rulesKind: yup.string().oneOf(["manual", "repository"]).defined(),
      customRulesFiles: yup
        .array()
        .of(customRulesFilesSchema)
        .when("rulesKind", {
          is: "manual",
          then: yup
            .array()
            .of(customRulesFilesSchema)
            .min(1, "At least 1 valid custom rule file must be uploaded.")
            .test(
              "All files are loaded successfully",
              (value) =>
                value?.every((cr) => cr.loadResult === "success") ?? false
            ),
          otherwise: (schema) => schema,
        }),
      repositoryType: yup.string().oneOf(["git", "svn"]).when("rulesKind", {
        is: "repository",
        then: yup.string().required(),
      }),
      sourceRepository: yup.string().when("rulesKind", {
        is: "repository",
        then: yup.string().required().repositoryUrl("repositoryType"),
      }),
      branch: yup.mixed<string>().when("rulesKind", {
        is: "repository",
        then: yup.mixed<string>(),
      }),
      rootPath: yup.mixed<string>().when("rulesKind", {
        is: "repository",
        then: yup.mixed<string>(),
      }),
      associatedCredentials: yup.mixed<any>().when("rulesKind", {
        is: "repository",
        then: yup.mixed<any>(),
      }),
    });

  const getInitialCustomRulesFilesData = () =>
    target?.ruleset?.rules?.map((rule): IReadFile => {
      const emptyFile = new File([], rule.name, {
        type: "placeholder",
      });
      return {
        fileName: rule.name,
        fullFile: emptyFile,
        loadResult: "success",
        loadPercentage: 100,
      };
    }) || [];

  const methods = useForm<CustomTargetFormValues>({
    defaultValues: {
      id: target?.id || 0,
      name: target?.name || "",
      description: target?.description || "",
      providerType: target?.provider ?? DEFAULT_PROVIDER,
      imageID: target?.image?.id || null,
      customRulesFiles: getInitialCustomRulesFilesData(),
      rulesKind: !target
        ? "manual"
        : target?.ruleset?.rules?.length
          ? "manual"
          : "repository",
      associatedCredentials: identities.find(
        (identity) => identity.id === target?.ruleset?.identity?.id
      )?.name,
      repositoryType: target?.ruleset?.repository?.kind,
      sourceRepository: target?.ruleset?.repository?.url,
      branch: target?.ruleset?.repository?.branch,
      rootPath: target?.ruleset?.repository?.path,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    setFocus,
    clearErrors,
    trigger,
    reset,
  } = methods;

  useEffect(() => {
    setTarget(initialTarget);
    if (initialTarget?.image?.id === 1) {
      setImageFilename("default.png");
    } else {
      setImageFilename(initialTarget?.image?.name || "default.png");
    }
    return () => {
      setTarget(undefined);
      setImageFilename("default.png");
    };
  }, [initialTarget]);

  const values = getValues();

  const onSubmit = async (formValues: CustomTargetFormValues) => {
    const rules: Rule[] = [];
    const labels: TargetLabel[] = [];

    formValues.customRulesFiles.forEach((file) => {
      if (file.data && file?.fullFile?.type !== "placeholder") {
        const { fileID, allLabels } = parseRules(file);
        const newRule: Rule = {
          name: file.fileName,
          labels: allLabels,
          file: {
            id: fileID ? fileID : 0,
          },
        };
        rules.push(newRule);
        labels.push(
          ...(allLabels?.map(
            (label): TargetLabel => ({
              name: getParsedLabel(label).labelValue,
              label,
            })
          ) ?? [])
        );
      } else {
        const matchingExistingRule = target?.ruleset?.rules.find(
          (ruleset) => ruleset.name === file.fileName
        );
        if (matchingExistingRule) {
          rules.push(matchingExistingRule);
        }
      }
    });

    const matchingSourceCredential = identities.find(
      (identity) => identity.name === formValues.associatedCredentials
    );

    // Upload the defaultImage for the task if no image is defined
    let imageId = formValues.imageID;
    if (imageId === null) {
      try {
        const res = await fetch(defaultImage);
        const blob = await res.blob();
        const defaultImageFile = new File([blob], "default.png", {
          type: res.type,
        });
        const hubFile = await handleImageFileUpload(defaultImageFile);
        imageId = hubFile.id;
      } catch {
        imageId = null;
      }
    }

    const payload: New<Target> = {
      name: formValues.name.trim(),
      description: formValues?.description?.trim() || "",
      ...(imageId && { image: { id: imageId } }),
      custom: true,
      labels: labels.length ? labels : [],
      ruleset: {
        id: target && target.custom ? target.ruleset.id : undefined,
        name: formValues.name.trim(),
        rules: rules,
        ...(formValues.rulesKind === "repository" && {
          repository: {
            kind: formValues?.repositoryType,
            url: formValues?.sourceRepository?.trim(),
            branch: formValues?.branch?.trim(),
            path: formValues?.rootPath?.trim(),
          },
        }),
        ...(formValues.associatedCredentials &&
          matchingSourceCredential &&
          formValues.rulesKind === "repository" && {
            identity: {
              id: matchingSourceCredential.id,
              name: matchingSourceCredential.name,
            },
          }),
      },
      provider: formValues.providerType,
    };

    if (target) {
      updateTarget({ id: target.id, ...payload });
    } else {
      createTarget(payload);
    }
  };

  const { mutateAsync: createImageFileAsync } = useCreateFileMutation();

  const onCreateTargetSuccess = (response: AxiosResponse<Target>) => {
    onSaved(response);
    reset();
  };

  const onCreateTargetFailure = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createTarget } = useCreateTargetMutation(
    onCreateTargetSuccess,
    onCreateTargetFailure
  );

  const onUpdateTargetSuccess = (response: AxiosResponse<Target>) => {
    onSaved(response);
    reset();
  };

  const onUpdateTargetFailure = (_error: AxiosError) => {};

  const { mutate: updateTarget } = useUpdateTargetMutation(
    onUpdateTargetSuccess,
    onUpdateTargetFailure
  );

  const handleImageFileUpload = async (file: File) => {
    setImageFilename(file.name);
    const formFile = new FormData();
    formFile.append("file", file);

    const newImageFile: IReadFile = {
      fileName: file.name,
      fullFile: file,
    };

    return createImageFileAsync({
      formData: formFile,
      file: newImageFile,
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label="Name"
        fieldId="name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="description"
        label="Description"
        fieldId="description"
      />
      <HookFormPFGroupController
        control={control}
        name="providerType"
        label="Provider"
        fieldId="provider-type-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            id="provider-type-select"
            toggleId="provider-type-select-toggle"
            toggleAriaLabel="Provider type select dropdown toggle"
            aria-label={name}
            value={value ? toOptionLike(value, providerListOptions) : undefined}
            options={providerListOptions}
            onChange={(selection) => {
              const selectionValue = selection as OptionWithValue<string>;
              onChange(selectionValue.value);
            }}
          />
        )}
      />

      <HookFormPFGroupController
        control={control}
        name="imageID"
        label={t("terms.image")}
        fieldId="custom-migration-target-upload-image"
        helperText="Upload a png or jpeg file (Max size: 1 MB)"
        renderInput={({ field: { onChange, name } }) => (
          <>
            {imageRejectedError && (
              <Alert
                variant="danger"
                isInline
                className={spacing.mbMd}
                title={imageRejectedError}
                actionClose={
                  <AlertActionCloseButton
                    onClose={() => {
                      onChange(null);
                      setImageFilename("default.png");
                      setValue("imageID", null);
                      setImageRejectedError(null);
                    }}
                  />
                }
              />
            )}
            <FileUpload
              id="custom-migration-target-upload-image"
              name={name}
              value={imageFilename}
              filename={imageFilename}
              filenamePlaceholder="Drag and drop a file or upload one"
              dropzoneProps={{
                accept: {
                  "image/png": [".png"],
                  "image/jpeg": [".jpeg", ".jpg"],
                },
                maxSize: 1000000,
                onDropRejected: (event) => {
                  const currentFile = event[0];
                  if (currentFile.file.size > 1000000) {
                    setImageRejectedError(
                      "Max image file size of 1 MB exceeded."
                    );
                  }
                  setImageFilename(currentFile.file.name);
                },
              }}
              validated={"default"}
              onFileInputChange={(_, file) => {
                handleImageFileUpload(file)
                  .then((hubFile) => {
                    setValue("imageID", hubFile.id);
                    setFocus("imageID");
                    clearErrors("imageID");
                    trigger("imageID");
                  })
                  .catch(() => {
                    setValue("imageID", null);
                  });
              }}
              onClearClick={() => {
                setImageRejectedError(null);
                onChange(null);
                setImageFilename("default.png");
                setValue("imageID", null);
              }}
              browseButtonText="Upload"
            />
          </>
        )}
      />

      <HookFormPFGroupController
        control={control}
        name="rulesKind"
        label="Custom rules"
        fieldId="type-select"
        isRequired
        renderInput={({ field: { value, onChange } }) => (
          <>
            <Radio
              id="manual"
              name="Upload manually"
              isChecked={value === "manual"}
              onChange={() => {
                onChange("manual");
              }}
              label="Upload manually"
              className={spacing.mbXs}
            />
            <Radio
              id="repository"
              name="repository"
              isChecked={value === "repository"}
              onChange={() => {
                onChange("repository");
              }}
              label="Retrieve from a repository"
              className={spacing.mbXs}
            />
          </>
        )}
      />

      {values?.rulesKind === "manual" && (
        <CustomRuleFilesUpload
          ruleFiles={values.customRulesFiles}
          onAddRuleFiles={(ruleFiles) => {
            // setNewRuleFiles((existing) => {
            //   if (!existing) return existing;
            //   existing.push(ruleFile);
            //   existing.sort();
            //   return existing;
            // });
          }}
          onRemoveRuleFiles={(ruleFiles) => {
            // setNewRuleFiles((existing) => {
            //   if (!existing) return existing;
            //   return existing.filter(
            //     ({ fileName }) => fileName !== ruleFile.fileName
            //   );
            // });
          }}
          onChangeRuleFile={(ruleFile) => {
            // setNewRuleFiles((existing) => {
            //   if (!existing) return existing;
            //   const at = existing.findIndex(
            //     ({ fileName }) => fileName !== ruleFile.fileName
            //   );
            //   if (at >= 0) existing[at] = ruleFile;
            //   return existing;
            // });
          }}
          // onChangeRuleFile={(ruleFile: IReadFile) => {
          //   console.log("rule files:", ruleFiles);
          //   setValue("customRulesFiles", ruleFiles, {
          //     shouldDirty: true,
          //     shouldValidate: true,
          //   });
          //   trigger("customRulesFiles");
          // }}
        />
      )}

      {values?.rulesKind === "repository" && (
        <>
          <HookFormPFGroupController
            control={control}
            name="repositoryType"
            label="Repository type"
            fieldId="repo-type-select"
            isRequired
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                id="repo-type-select"
                toggleId="repo-type-select-toggle"
                toggleAriaLabel="Repository type select dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, repositoryTypeOptions) : undefined
                }
                options={repositoryTypeOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                  trigger("sourceRepository");
                }}
              />
            )}
          />
          <HookFormPFTextInput
            control={control}
            name="sourceRepository"
            label="Source repository"
            fieldId="sourceRepository"
            isRequired
          />
          <HookFormPFTextInput
            control={control}
            name="branch"
            label="Branch"
            fieldId="branch"
          />
          <HookFormPFTextInput
            control={control}
            name="rootPath"
            label="Root path"
            fieldId="rootPath"
          />
          <HookFormPFGroupController
            control={control}
            name="associatedCredentials"
            label="Associated credentials"
            fieldId="credentials-select"
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                variant="typeahead"
                id="associated-credentials-select"
                toggleId="associated-credentials-select-toggle"
                toggleAriaLabel="Associated credentials dropdown toggle"
                aria-label={name}
                value={
                  value ? toOptionLike(value, sourceIdentityOptions) : undefined
                }
                options={sourceIdentityOptions}
                onChange={(selection) => {
                  const selectionValue = selection as OptionWithValue<string>;
                  onChange(selectionValue.value);
                }}
                onClear={() => onChange("")}
              />
            )}
          />
        </>
      )}

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid ||
            isSubmitting ||
            isValidating ||
            !isDirty ||
            !!imageRejectedError
          }
        >
          {!target ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
