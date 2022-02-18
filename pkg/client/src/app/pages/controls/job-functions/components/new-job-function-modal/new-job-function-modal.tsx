import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { JobFunction } from "@app/api/models";

import { JobFunctionForm } from "../job-function-form";

export interface NewJobFunctionModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<JobFunction>) => void;
  onCancel: () => void;
}

export const NewJobFunctionModal: React.FC<NewJobFunctionModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newJobFunction")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <JobFunctionForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
