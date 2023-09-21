import React, { useState } from "react";
import { AxiosError } from "axios";
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
import { Questionnaire } from "@app/api/models";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCreateQuestionnaireMutation } from "@app/queries/questionnaires";
import jsYaml from "js-yaml";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { getAxiosErrorMessage } from "@app/utils/utils";

export interface ImportQuestionnaireFormProps {
  onSaved: (response?: Questionnaire) => void;
}
export interface ImportQuestionnaireFormValues {
  yamlFile: string;
}

export const ImportQuestionnaireForm: React.FC<
  ImportQuestionnaireFormProps
> = ({ onSaved }) => {
  const { t } = useTranslation();

  const [filename, setFilename] = useState<string>();
  const [isFileRejected, setIsFileRejected] = useState(false);
  const validationSchema: yup.SchemaOf<ImportQuestionnaireFormValues> = yup
    .object()
    .shape({
      yamlFile: yup.string().required(),
    });
  const methods = useForm<ImportQuestionnaireFormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
    setFocus,
    clearErrors,
    trigger,
  } = methods;

  const onHandleSuccessfulQuestionnaireCreation = (response: Questionnaire) => {
    onSaved(response);
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.questionnaire"),
        what: response.name,
      }),
      variant: "success",
    });
    onSaved();
  };

  const onHandleFailedQuestionnaireCreation = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: createQuestionnaire } = useCreateQuestionnaireMutation(
    onHandleSuccessfulQuestionnaireCreation,
    onHandleFailedQuestionnaireCreation
  );

  const { pushNotification } = React.useContext(NotificationsContext);

  const convertYamlToJson = (yamlString: string) => {
    try {
      const jsonData = jsYaml.load(yamlString);
      return jsonData;
    } catch (error) {
      pushNotification({
        title: "Failed",
        message: getAxiosErrorMessage(error as AxiosError),
        variant: "danger",
        timeout: 30000,
      });
    }
  };

  function isQuestionnaire(data: any): data is Questionnaire {
    return (
      typeof data === "object" &&
      data !== null &&
      "name" in data &&
      "description" in data
    );
  }

  const onSubmit = (values: ImportQuestionnaireFormValues) => {
    if (values.yamlFile) {
      try {
        const jsonData = convertYamlToJson(values.yamlFile);

        if (isQuestionnaire(jsonData)) {
          const questionnaireData = jsonData as Questionnaire;

          createQuestionnaire(questionnaireData);
        } else {
          console.error("Invalid JSON data.");
        }
      } catch (error) {
        pushNotification({
          title: "Failed",
          message: getAxiosErrorMessage(error as AxiosError),
          variant: "danger",
          timeout: 30000,
        });
      }
    }
  };
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFGroupController
        control={control}
        name="yamlFile"
        label={t("terms.uploadYamlFile")}
        fieldId="yamlFile"
        helperText={t("dialog.message.uploadYamlFile")}
        renderInput={({ field: { onChange, name }, fieldState: { error } }) => (
          <FileUpload
            id={`${name}-file-upload`}
            name={name}
            value={filename}
            filename={filename}
            filenamePlaceholder={t("dialog.message.dragAndDropFile")}
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
                    message: t("dialog.message.maxFileSize"),
                  });
                }
                setIsFileRejected(true);
              },
            }}
            validated={isFileRejected || error ? "error" : "default"}
            onFileInputChange={async (_, file) => {
              try {
                if (!file) {
                  console.error("No file selected.");
                  return;
                }

                const reader = new FileReader();

                reader.onload = (e) => {
                  try {
                    const yamlContent = e?.target?.result as string;
                    onChange(yamlContent);
                    setFilename(file.name);
                  } catch (error) {
                    console.error("Error reading YAML file:", error);
                  }
                };

                reader.readAsText(file);
                setFocus(name);
                clearErrors(name);
                trigger(name);
              } catch (err) {
                pushNotification({
                  title: "Failed",
                  message: getAxiosErrorMessage(err as AxiosError),
                  variant: "danger",
                  timeout: 30000,
                });
              }
            }}
            onClearClick={() => {
              onChange("");
              setFilename("");
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
