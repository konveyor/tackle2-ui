import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  Button,
  FileUpload,
  Form,
  FormGroup,
} from "@patternfly/react-core";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";

import { UPLOAD_FILE } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";

export interface ImportApplicationsFormProps {
  onSaved: (response: AxiosResponse) => void;
}

export const ImportApplicationsForm: React.FC<ImportApplicationsFormProps> = ({
  onSaved,
}) => {
  const { t } = useTranslation();

  const [file, setFile] = useState<File>();
  const [isFileRejected, setIsFileRejected] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AxiosError>();

  // Redux
  const dispatch = useDispatch();

  // Actions
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
    const config = {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    };
    setIsSubmitting(true);
    axios
      .post(UPLOAD_FILE, formData, config)
      .then((response) => {
        dispatch(
          alertActions.addSuccess(t("toastr.success.fileSavedToBeProcessed"))
        );

        setIsSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        setIsSubmitting(false);
        setError(error);
      });
  };
  return (
    <Form>
      {error && <Alert variant="danger" title={getAxiosErrorMessage(error)} />}

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
