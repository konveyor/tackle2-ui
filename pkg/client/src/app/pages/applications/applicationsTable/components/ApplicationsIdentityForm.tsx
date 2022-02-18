import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";

import { getAxiosErrorMessage } from "@app/utils/utils";
import { Application } from "@app/api/models";

export interface ApplicationsIdentityFormProps {
  selectedApplications: Application[];
  onSaved: (response: AxiosResponse) => void;
  onCancel: () => void;
}

export const ApplicationsIdentityForm: React.FC<
  ApplicationsIdentityFormProps
> = ({ selectedApplications, onSaved, onCancel }) => {
  const { t } = useTranslation();

  const selectedApplicationsNames = selectedApplications
    .reduce((names, app) => names.concat(app.name + ", "), "")
    .slice(0, -2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<AxiosError>();

  // Redux
  const dispatch = useDispatch();

  // Actions
  const onSubmit = () => {
    // if (!file) {
    //   return;
    // }
    // const formData = new FormData();
    // formData.set("file", file);
    // formData.set("fileName", file.name);
    // const config = {
    //   headers: {
    //     "X-Requested-With": "XMLHttpRequest",
    //   },
    // };
    // setIsSubmitting(true);
    // axios
    //   .post(UPLOAD_FILE, formData, config)
    //   .then((response) => {
    //     dispatch(
    //       alertActions.addSuccess(t("toastr.success.fileSavedToBeProcessed"))
    //     );
    //     setIsSubmitting(false);
    //     onSaved(response);
    //   })
    //   .catch((error) => {
    //     setIsSubmitting(false);
    //     setError(error);
    //   });
    return null;
  };
  return (
    <Form>
      {error && <Alert variant="danger" title={getAxiosErrorMessage(error)} />}
      <TextInput
        value={selectedApplicationsNames}
        type="text"
        aria-label="Manage credentials selected applications"
        isReadOnly
      />
      <FormGroup
        fieldId="file"
        // helperTextInvalid="You should select a CSV file."
        // validated={isFileRejected ? "error" : "default"}
      ></FormGroup>
      <ActionGroup>
        <Button
          variant={ButtonVariant.primary}
          aria-label="submit"
          onClick={onSubmit}
          isDisabled={true}
          // isDisabled={
          //   !formik.isValid ||
          //   !formik.dirty ||
          //   formik.isSubmitting ||
          //   formik.isValidating
          // }
        >
          {t("actions.save")}
        </Button>
        <Button
          type="button"
          aria-label="cancel"
          variant={ButtonVariant.link}
          onClick={onCancel}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
