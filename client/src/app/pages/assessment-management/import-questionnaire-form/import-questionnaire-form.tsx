import React, { useMemo, useState } from "react";
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
import {
  useCreateQuestionnaireMutation,
  useFetchQuestionnaires,
} from "@app/queries/questionnaires";
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
  const { pushNotification } = React.useContext(NotificationsContext);

  const [filename, setFilename] = useState<string>();
  const [isFileRejected, setIsFileRejected] = useState(false);
  const { questionnaires, isFetching } = useFetchQuestionnaires();

  const existingNames = useMemo(() => {
    return questionnaires?.map(({ name }) => name.trim().toLowerCase()) || [];
  }, [questionnaires]);

  const validationSchema: yup.SchemaOf<ImportQuestionnaireFormValues> = yup
    .object()
    .shape({
      yamlFile: yup
        .string()
        .required(t("validation.invalidQuestionnaireYAML"))
        .test(
          "Valid Questionnaire YAML",
          t("validation.invalidQuestionnaireYAML"),
          (yamlFile) => {
            if (!yamlFile) {
              return true;
            }
            const jsonData = convertYamlToJson(yamlFile);
            return isQuestionnaire(jsonData);
          }
        )
        .test(
          "Duplicate name",
          t("validation.duplicateName", { type: "questionnaire" }),
          (yamlFile) => {
            if (!yamlFile) {
              return true;
            }
            const jsonData = convertYamlToJson(yamlFile);
            if (isQuestionnaire(jsonData)) {
              const normalizedName = jsonData.name.trim().toLowerCase();
              const isDuplicate = existingNames.includes(normalizedName);
              return !isDuplicate;
            }
            return true;
          }
        ),
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
    setFocus,
    setError,
    clearErrors,
    trigger,
  } = useForm<ImportQuestionnaireFormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

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

  const convertYamlToJson = (yamlString: string): unknown | null => {
    try {
      const jsonData = jsYaml.load(yamlString);
      return jsonData;
    } catch (error) {
      return null;
    }
  };

  function isQuestionnaire(data: unknown): data is Questionnaire {
    return (
      typeof data === "object" &&
      data !== null &&
      "name" in data &&
      "description" in data
    );
  }

  const onSubmit = ({ yamlFile }: ImportQuestionnaireFormValues) => {
    if (yamlFile) {
      try {
        createQuestionnaire(convertYamlToJson(yamlFile) as Questionnaire);
      } catch (error) {
        pushNotification({
          title: "Failed",
          message:
            error instanceof AxiosError
              ? getAxiosErrorMessage(error as AxiosError)
              : error instanceof Error
                ? error.message
                : "Error",
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
                  setError(name, {
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
                  return;
                }

                const reader = new FileReader();

                reader.onload = (e) => {
                  try {
                    const yamlContent = e?.target?.result as string;
                    onChange(yamlContent);
                    setFilename(file.name);
                  } catch (error) {
                    setError(name, {
                      type: "custom",
                      message: t("message.errorReadingFile"),
                    });
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
          isDisabled={
            !isValid || isSubmitting || isValidating || isFetching || !isDirty
          }
        >
          {t("actions.import")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
