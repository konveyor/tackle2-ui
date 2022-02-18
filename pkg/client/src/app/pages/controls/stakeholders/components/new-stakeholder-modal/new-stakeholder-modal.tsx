import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Stakeholder } from "@app/api/models";

import { StakeholderForm } from "../stakeholder-form";

export interface NewStakeholderModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<Stakeholder>) => void;
  onCancel: () => void;
}

export const NewStakeholderModal: React.FC<NewStakeholderModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newStakeholder")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <StakeholderForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
