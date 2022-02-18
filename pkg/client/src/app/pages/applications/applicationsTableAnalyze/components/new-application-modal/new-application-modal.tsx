import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Application } from "@app/api/models";

import { ApplicationForm } from "../application-form";

export interface NewApplicationModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<Application>) => void;
  onCancel: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newApplication")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <ApplicationForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
