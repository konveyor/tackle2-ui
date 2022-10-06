import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  Checkbox,
  FileUpload,
  Form,
  FormGroup,
} from "@patternfly/react-core";
import { useDispatch } from "react-redux";

import { UPLOAD_FILE } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { NotificationsContext } from "@app/shared/notifications-context";

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
      <FormGroup
        fieldId="file"
        label={t("terms.uploadApplicationFile")}
        helperTextInvalid="You should select a CSV file."
        validated={isFileRejected ? "error" : "default"}
      >
        <FileUpload
          id="file"
          name="file"
          value={file}
          filename={file?.name}
          onChange={(value, filename) => {
            if (filename && typeof value !== "string") {
              setFile(value);
              setIsFileRejected(false);
            } else if (!filename) {
              setFile(undefined);
            }
          }}
          dropzoneProps={{
            accept: ".csv",
            onDropRejected: handleFileRejected,
          }}
          validated={isFileRejected ? "error" : "default"}
        />
      </FormGroup>
      <FormGroup fieldId="create-entities">
        <Checkbox
          label="Enable automatic creation of missing entities"
          isChecked={isCreateEntitiesChecked}
          onChange={(checked, _) => setIsCreateEntitiesChecked(checked)}
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
