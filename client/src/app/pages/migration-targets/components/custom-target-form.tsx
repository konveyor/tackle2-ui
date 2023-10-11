import React, { useContext, useEffect, useState } from "react";
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  Radio,
} from "@patternfly/react-core";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
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
import useRuleFiles from "@app/hooks/useRuleFiles";
import { customURLValidation, duplicateNameCheck } from "@app/utils/utils";
import { customRulesFilesSchema } from "../../applications/analysis-wizard/schema";
import {
  useCreateTargetMutation,
  useFetchTargets,
  useUpdateTargetMutation,
} from "@app/queries/targets";
import { NotificationsContext } from "@app/components/NotificationsContext";

export interface CustomTargetFormProps {
  target?: Target | null;
  onSaved: (response: AxiosResponse<Target>) => void;
  onCancel: () => void;
}

export interface CustomTargetFormValues {
  id: number;
  name: string;
  description?: string;
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
  const { t } = useTranslation();
  const [target, setTarget] = useState(initialTarget);
  const [imageRejectedError, setImageRejectedError] = useState<string | null>(
    null
  );

  const [filename, setFilename] = React.useState("default.png");

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
      imageID: yup.number().defined().nullable(),
      rulesKind: yup.string().defined(),
      customRulesFiles: yup
        .array()
        .of(customRulesFilesSchema)
        .when("rulesKind", {
          is: "manual",
          then: yup
            .array()
            .of(customRulesFilesSchema)
            .min(1, "At least 1 valid custom rule file must be uploaded."),
          otherwise: (schema) => schema,
        }),
      repositoryType: yup.mixed<string>().when("rulesKind", {
        is: "repository",
        then: yup.mixed<string>().required(),
      }),
      sourceRepository: yup.string().when("rulesKind", {
        is: "repository",
        then: (schema) =>
          customURLValidation(schema).required("Enter repository url."),
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
      const emptyFile = new File(["empty"], rule.name, {
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
      imageID: target?.image?.id || null,
      customRulesFiles: getInitialCustomRulesFilesData(),
      rulesKind: !target
        ? "manual"
        : target?.ruleset?.rules?.length
        ? "manual"
        : "repository",
      associatedCredentials: target?.ruleset?.identity?.name,
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
    watch,
    setFocus,
    clearErrors,
    trigger,
    reset,
  } = methods;

  useEffect(() => {
    setTarget(initialTarget);
    if (initialTarget?.image?.id === 1) {
      setFilename("default.png");
    } else {
      setFilename(initialTarget?.image?.name || "default.png");
    }
    return () => {
      setTarget(undefined);
      setFilename("default.png");
    };
  }, []);

  const watchAllFields = watch();
  const values = getValues();

  const {
    ruleFiles,
    handleFileDrop,
    showStatus,
    uploadError,
    setUploadError,
    setStatus,
    getloadPercentage,
    getloadResult,
    successfullyReadFileCount,
    handleFile,
    removeFiles,
  } = useRuleFiles(null, values.customRulesFiles, methods);

  const onSubmit = (formValues: CustomTargetFormValues) => {
    let rules: Rule[] = [];
    let labels: TargetLabel[] = [];

    ruleFiles.forEach((file) => {
      if (file.data && file?.fullFile?.type !== "placeholder") {
        const { fileID, allLabels } = parseRules(file);
        const newRule: Rule = {
          name: file.fileName,
          labels: allLabels,
          file: {
            id: fileID ? fileID : 0,
          },
        };
        rules = [...rules, newRule];
        labels = [
          ...labels,
          ...(allLabels?.map((label): TargetLabel => {
            return {
              name: getParsedLabel(label).labelValue,
              label: label,
            };
          }) || []),
        ];
      } else {
        const matchingExistingRule = target?.ruleset?.rules.find(
          (ruleset) => ruleset.name === file.fileName
        );
        if (matchingExistingRule) {
          rules = [...rules, matchingExistingRule];
        }
      }
    });

    const matchingSourceCredential = identities.find(
      (identity) => identity.name === formValues.associatedCredentials
    );

    const payload: New<Target> = {
      name: formValues.name.trim(),
      description: formValues?.description?.trim() || "",
      ...(formValues.imageID && { image: { id: formValues.imageID } }),
      custom: true,
      labels: labels.length ? labels : [{ name: "custom", label: "custom" }],
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
    };

    if (target) {
      formValues.imageID
        ? updateTarget({ id: target.id, ...payload })
        : fetch(defaultImage)
            .then((res) => res.blob())
            .then((res) => {
              const defaultImageFile = new File([res], "default.png");
              return handleFileUpload(defaultImageFile);
            })
            .then((res) => {
              updateTarget({
                id: target.id,
                ...payload,
                image: { id: res.id },
              });
            })
            .catch((err) => {
              console.error(err);
            });
    } else {
      formValues.imageID
        ? createTarget(payload)
        : fetch(defaultImage)
            .then((res) => res.blob())
            .then((res) => {
              const defaultImageFile = new File([res], "default.png", {
                type: res.type,
              });
              return handleFileUpload(defaultImageFile);
            })
            .then((res) => {
              createTarget({
                ...payload,
                image: { id: res.id },
              });
            })
            .catch((err) => {
              console.error(err);
            });
    }
  };

  const { mutateAsync: createImageFileAsync } = useCreateFileMutation();

  const onCreateTargetSuccess = (response: any) => {
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

  const onUpdateTargetSuccess = (response: any) => {
    onSaved(response);
    reset();
  };

  const onUpdateTargetFailure = (error: AxiosError) => {};

  const { mutate: updateTarget } = useUpdateTargetMutation(
    onUpdateTargetSuccess,
    onUpdateTargetFailure
  );

  const handleFileUpload = async (file: File) => {
    setFilename(file.name);
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
        name="imageID"
        label={t("terms.image")}
        fieldId="custom-migration-target-upload-image"
        helperText="Upload a png or jpeg file (Max size: 1 MB)"
        renderInput={({ field: { onChange, name }, fieldState: { error } }) => (
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
                      setFilename("default.png");
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
              value={filename}
              filename={filename}
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
                  setFilename(currentFile.file.name);
                },
              }}
              validated={"default"}
              onFileInputChange={async (_, file) => {
                handleFileUpload(file)
                  .then((res) => {
                    setValue("imageID", res.id);
                    setFocus("imageID");
                    clearErrors("imageID");
                    trigger("imageID");
                  })
                  .catch((err) => {
                    setValue("imageID", null);
                  });
              }}
              onClearClick={() => {
                setImageRejectedError(null);
                onChange(null);
                setFilename("default.png");
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
        renderInput={({ field: { value, name, onChange } }) => (
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
        <>
          {uploadError !== "" && (
            <Alert
              className={`${spacing.mtMd} ${spacing.mbMd}`}
              variant="danger"
              isInline
              title={uploadError}
              actionClose={
                <AlertActionCloseButton onClose={() => setUploadError("")} />
              }
            />
          )}
          <MultipleFileUpload
            onFileDrop={handleFileDrop}
            dropzoneProps={{
              accept: {
                "text/xml": [".xml"],
                "text/yaml": [".yml", ".yaml"],
              },
            }}
          >
            <MultipleFileUploadMain
              titleIcon={<UploadIcon />}
              titleText="Drag and drop files here"
              titleTextSeparator="or"
              infoText="Accepted file types: .yml, .yaml, .xml"
            />
            {showStatus && (
              <MultipleFileUploadStatus
                statusToggleText={`${successfullyReadFileCount} of ${ruleFiles.length} files uploaded`}
                statusToggleIcon={setStatus()}
              >
                {ruleFiles.map((file) => (
                  <MultipleFileUploadStatusItem
                    file={file.fullFile}
                    key={file.fileName}
                    customFileHandler={(file) => {
                      if (file.type === "placeholder") {
                        return null;
                      } else {
                        return handleFile(file);
                      }
                    }}
                    onClearClick={() => removeFiles([file.fileName])}
                    progressValue={getloadPercentage(file.fileName)}
                    progressVariant={getloadResult(file.fileName)}
                  />
                ))}
              </MultipleFileUploadStatus>
            )}
          </MultipleFileUpload>
        </>
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
            renderInput={({ field: { value, name, onBlur, onChange } }) => (
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
