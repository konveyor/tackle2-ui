import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { JobFunction } from "@app/api/models";

import { JobFunctionForm } from "../job-function-form";

export interface UpdateJobFunctionModalProps {
  jobFunction?: JobFunction;
  onSaved: (response: AxiosResponse<JobFunction>) => void;
  onCancel: () => void;
}

export const UpdateJobFunctionModal: React.FC<UpdateJobFunctionModalProps> = ({
  jobFunction,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateJobFunction")}
      variant={ModalVariant.medium}
      isOpen={!!jobFunction}
      onClose={onCancel}
    >
      <JobFunctionForm
        jobFunction={jobFunction}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
