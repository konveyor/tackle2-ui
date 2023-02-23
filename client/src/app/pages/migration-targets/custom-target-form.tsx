import * as React from "react";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Resizer from "react-image-file-resizer";

import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { IReadFile, RuleBundle, Ruleset } from "@app/api/models";
import { AddCustomRules } from "@app/common/CustomRules/add-custom-rules";
import { parseRules } from "@app/common/CustomRules/rules-utils";
import {
  useCreateFileMutation,
  useCreateRuleBundleMutation,
  useUpdateRuleBundleMutation,
} from "@app/queries/rulebundles";
import { AxiosError, AxiosResponse } from "axios";

export interface CustomTargetFormProps {
  ruleBundle?: RuleBundle;
  onSaved: (response: AxiosResponse<RuleBundle>) => void;
  onCancel: () => void;
}

interface CustomTargetFormValues {
  id: number;
  name: string;
  description?: string;
  imageID: number | null;
  customRulesFiles: any[];
}

export const CustomTargetForm: React.FC<CustomTargetFormProps> = ({
  ruleBundle: initialRuleBundle,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [readFileData, setReadFileData] = React.useState<IReadFile[]>([]);

  const [ruleBundle, setRuleBundle] = useState(initialRuleBundle);

  const [filename, setFilename] = React.useState("");

  const [isImageFileRejected, setIsImageFileRejected] = useState(false);

  const resizeFile = (file: File) =>
    new Promise<File>((resolve) => {
      const extension = file?.name?.split(".")[1];
      Resizer.imageFileResizer(
        file,
        80,
        80,
        extension,
        100,
        0,
        (uri) => {
          resolve(uri as File);
        },
        "file"
      );
    });

  const validationSchema: yup.SchemaOf<CustomTargetFormValues> = yup
    .object()
    .shape({
      id: yup.number().defined(),
      name: yup
        .string()
        .trim()
        .required(t("validation.required"))
        .min(3, t("validation.minLength", { length: 3 }))
        .max(120, t("validation.maxLength", { length: 120 })),
      description: yup.string(),
      imageID: yup.number().defined().required(),
      customRulesFiles: yup.array().min(1),
    });

  const {
    handleSubmit,
    formState: {
      isSubmitting,
      isValidating,
      isValid,
      isDirty,
      errors,
      touchedFields,
      isLoading,
    },
    getValues,
    setValue,
    setError,
    control,
    watch,
    resetField,
    reset,
  } = useForm<CustomTargetFormValues>({
    defaultValues: {
      id: ruleBundle?.id || 0,
      name: ruleBundle?.name || "",
      description: ruleBundle?.description || "",
      imageID: ruleBundle?.image.id || null,
      customRulesFiles:
        ruleBundle?.rulesets.map((ruleset): IReadFile => {
          const emptyFile = new File(["empty"], ruleset.name, {
            type: "placeholder",
          });
          return {
            fileName: ruleset.name,
            fullFile: emptyFile,
          };
        }) || [],
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    setRuleBundle(initialRuleBundle);
    setFilename(initialRuleBundle?.image?.name || "");
    return () => {
      setRuleBundle(undefined);
      setFilename("");
    };
  }, []);

  const watchAllFields = watch();

  const onSubmit = (formValues: CustomTargetFormValues) => {
    let rulesets: Ruleset[] = [];

    readFileData.forEach((file) => {
      if (file.data && file.fullFile.type !== "placeholder") {
        const newParsedFile = parseRules(file);
        const newRuleset: Ruleset = {
          name: file.fileName,
          metadata: {
            target: newParsedFile.parsedRuleset?.target
              ? newParsedFile.parsedRuleset.target
              : "",
            source: newParsedFile.parsedRuleset?.source
              ? newParsedFile.parsedRuleset.source
              : "",
          },
          file: {
            id: newParsedFile.parsedRuleset?.fileID
              ? newParsedFile.parsedRuleset.fileID
              : 0,
          },
        };
        rulesets = [...rulesets, newRuleset];
      } else {
        //existing ruleset
        const matchingExistingRuleset = ruleBundle?.rulesets.find(
          (ruleset) => ruleset.name === file.fileName
        );
        if (matchingExistingRuleset) {
          rulesets = [...rulesets, matchingExistingRuleset];
        }
      }
    });

    const payload: RuleBundle = {
      id: formValues.id,
      name: formValues.name.trim(),
      description: formValues?.description?.trim() || "",
      image: { id: formValues.imageID ? formValues.imageID : 0 },
      custom: true,
      rulesets: rulesets,
    };
    if (ruleBundle) {
      updateRuleBundle({ ...payload });
    } else {
      createRuleBundle(payload);
    }
  };

  const onCreateImageFileSuccess = (response: any) => {
    //Set image ID for use in form submit
    setValue("imageID", response?.id);
  };

  const onCreateImageFileFailure = (error: AxiosError) => {
    resetField("imageID");
  };

  const { mutate: createImageFile } = useCreateFileMutation(
    onCreateImageFileSuccess,
    onCreateImageFileFailure
  );

  const onCreateRuleBundleSuccess = (response: any) => {
    onSaved(response);
    reset();
  };

  const onCreateRuleBundleFailure = (error: AxiosError) => {};

  const { mutate: createRuleBundle } = useCreateRuleBundleMutation(
    onCreateRuleBundleSuccess,
    onCreateRuleBundleFailure
  );

  const onUpdateRuleBundleSuccess = (response: any) => {
    onSaved(response);
    reset();
  };

  const onUpdateRuleBundleFailure = (error: AxiosError) => {};

  const { mutate: updateRuleBundle } = useUpdateRuleBundleMutation(
    onUpdateRuleBundleSuccess,
    onUpdateRuleBundleFailure
  );

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
        isRequired
        helperText="Upload a png or jpeg file"
        renderInput={({ field: { onChange, name } }) => (
          <FileUpload
            id="custom-migration-target-upload-image"
            name={name}
            value={filename}
            filename={filename}
            filenamePlaceholder="Drag and drop a file or upload one"
            dropzoneProps={{
              accept: ".png, .jpeg",
              maxSize: 1000000,
              onDropRejected: () => setIsImageFileRejected(true),
            }}
            validated={isImageFileRejected ? "error" : "default"}
            onFileInputChange={async (e, file) => {
              try {
                const image = await resizeFile(file);
                setFilename(image.name);
                const formFile = new FormData();
                formFile.append("file", file);

                const newImageFile: IReadFile = {
                  fileName: file.name,
                  fullFile: file,
                };

                createImageFile({ formData: formFile, file: newImageFile });
              } catch {
                resetField("imageID");
              }
            }}
            onClearClick={() => {
              onChange("");
              setFilename("");
              resetField("imageID");
              setIsImageFileRejected(false);
            }}
            browseButtonText="Upload"
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="customRulesFiles"
        label={t("terms.image")}
        fieldId="custom-migration-target-upload-image"
        isRequired
        renderInput={({ field: { onChange, name, value } }) => (
          <AddCustomRules
            customRulesFiles={value}
            readFileData={readFileData}
            setReadFileData={setReadFileData}
            handleCustomTargetFileChange={onChange}
          />
        )}
      ></HookFormPFGroupController>

      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="identity-form-submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!ruleBundle ? t("actions.create") : t("actions.save")}
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
