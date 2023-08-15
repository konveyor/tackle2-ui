import React, { useState } from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import {
  ActionGroup,
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

import { HookFormPFGroupController } from "@app/components/HookFormPFFields";
import { useForm } from "react-hook-form";
import { FileLoadError, IReadFile } from "@app/api/models";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCreateFileMutation } from "@app/queries/targets";

export interface ImportQuestionnaireFormProps {
  onSaved: (response?: AxiosResponse) => void;
}
export interface ImportQuestionnaireFormValues {
  yamlFile: IReadFile;
}

export const yamlFileSchema: yup.SchemaOf<IReadFile> = yup.object({
  fileName: yup.string().required(),
  fullFile: yup.mixed<File>(),
  loadError: yup.mixed<FileLoadError>(),
  loadPercentage: yup.number(),
  loadResult: yup.mixed<"danger" | "success" | undefined>(),
  data: yup.string(),
  responseID: yup.number(),
});

export const ImportQuestionnaireForm: React.FC<
  ImportQuestionnaireFormProps
> = ({ onSaved }) => {
  const { t } = useTranslation();

  const [filename, setFilename] = useState<string>();
  const [isFileRejected, setIsFileRejected] = useState(false);
  const validationSchema: yup.SchemaOf<ImportQuestionnaireFormValues> = yup
    .object()
    .shape({
      yamlFile: yamlFileSchema,
    });
  const methods = useForm<ImportQuestionnaireFormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
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

  const { mutateAsync: createYamlFileAsync } = useCreateFileMutation();

  const handleFileUpload = async (file: File) => {
    setFilename(file.name);
    const formFile = new FormData();
    formFile.append("file", file);

    const newYamlFile: IReadFile = {
      fileName: file.name,
      fullFile: file,
    };

    return createYamlFileAsync({
      formData: formFile,
      file: newYamlFile,
    });
  };

  const onSubmit = (values: ImportQuestionnaireFormValues) => {
    console.log("values", values);
    onSaved();
  };
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFGroupController
        control={control}
        name="yamlFile"
        label={t("terms.uploadYamlFile")}
        fieldId="yamlFile"
        helperText={t("dialog.uploadYamlFile")}
        renderInput={({ field: { onChange, name }, fieldState: { error } }) => (
          <FileUpload
            id={`${name}-file-upload`}
            name={name}
            value={filename}
            filename={filename}
            filenamePlaceholder={t("dialog.dragAndDropFile")}
            dropzoneProps={{
              accept: {
                "text/yaml": [".yml", ".yaml"],
              },
              maxSize: 1000000,
              onDropRejected: (event) => {
                const currentFile = event[0];
                if (currentFile.file.size > 1000000) {
                  methods.setError(name, {
                    type: "custom",
                    message: t("dialog.maxFileSize"),
                  });
                }
                setIsFileRejected(true);
              },
            }}
            validated={isFileRejected || error ? "error" : "default"}
            onFileInputChange={async (_, file) => {
              console.log("uploading file", file);
              //TODO: handle new api here. This is just a placeholder.
              try {
                await handleFileUpload(file);
                setFocus(name);
                clearErrors(name);
                trigger(name);
              } catch (err) {
                //Handle new api error here
              }
            }}
            onClearClick={() => {
              //TODO
              console.log("clearing file");
            }}
            browseButtonText="Upload"
          />
        )}
      />

      {isFileRejected && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error">
              You should select a YAML file.
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
      <ActionGroup>
        <Button
          type="submit"
          aria-label="submit"
          id="import-questionnaire-submit-button"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {t("actions.import")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
