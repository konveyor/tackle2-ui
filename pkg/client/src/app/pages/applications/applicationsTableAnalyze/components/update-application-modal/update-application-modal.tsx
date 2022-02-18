import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Application } from "@app/api/models";

import { ApplicationForm } from "../application-form";

export interface UpdateApplicationModalProps {
  application?: Application;
  onSaved: (response: AxiosResponse<Application>) => void;
  onCancel: () => void;
}

export const UpdateApplicationModal: React.FC<UpdateApplicationModalProps> = ({
  application,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateApplication")}
      variant={ModalVariant.medium}
      isOpen={!!application}
      onClose={onCancel}
    >
      <ApplicationForm
        application={application}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
