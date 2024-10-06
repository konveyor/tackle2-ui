import React, { useState } from "react";
import axios, { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Button,
  Checkbox,
  FileUpload,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

import { UPLOAD_FILE } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { NotificationsContext } from "@app/components/NotificationsContext";

export interface ImportApplicationsFormProps {
  onSaved: (response: AxiosResponse) => void;
}

export const ImportApplicationsForm: React.FC<ImportApplicationsFormProps> = ({
  onSaved,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [file, setFile] = useState<File>();
  const [isCreateEntitiesChecked, setIsCreateEntitiesChecked] =
    useState<boolean>(true);
  const [isFileRejected, setIsFileRejected] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileRejected = () => {
    setIsFileRejected(true);
  };

  const onSubmit = () => {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("fileName", file.name);
    formData.set(
      "createEntities",
      isCreateEntitiesChecked === true ? "true" : "false"
    );
    const config = {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    };
    setIsSubmitting(true);
    axios
      .post(UPLOAD_FILE, formData, config)
      .then((response) => {
        pushNotification({
          title: t("toastr.success.fileSavedToBeProcessed"),
          variant: "success",
        });

        setIsSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        setIsSubmitting(false);
        if (typeof getAxiosErrorMessage(error) === "string") {
          pushNotification({
            title: getAxiosErrorMessage(error),
            variant: "danger",
          });
        }
        onSaved(error);
      });
  };
  return (
    <Form>
      <FormGroup fieldId="file" label={t("terms.uploadApplicationFile")}>
        <FileUpload
          id="file"
          name="file"
          value={file}
          filename={file?.name}
          onFileInputChange={(_, file) => {
            if (file) {
              setFile(file);
              setIsFileRejected(false);
            } else if (!file) {
              setFile(undefined);
            }
          }}
          dropzoneProps={{
            accept: {
              "text/csv": [".csv"],
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
              "application/vnd.ms-excel": [".xls"],
              "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
            },
            onDropRejected: handleFileRejected,
          }}
          onClearClick={() => {
            setFile(undefined);
          }}
        />
        {isFileRejected && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant="error">
                {t("message.unsupportedFileType")}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup fieldId="create-entities">
        <Checkbox
          label="Enable automatic creation of missing entities"
          isChecked={isCreateEntitiesChecked}
          onChange={(_, checked) => setIsCreateEntitiesChecked(checked)}
          id="create-entities-checkbox"
          name="createEntities"
        />
      </FormGroup>
      <ActionGroup>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={!file || isSubmitting}
        >
          {t("actions.import")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
