import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Stakeholder } from "@app/api/models";

import { StakeholderForm } from "../stakeholder-form";

export interface UpdateStakeholderModalProps {
  stakeholder?: Stakeholder;
  onSaved: (response: AxiosResponse<Stakeholder>) => void;
  onCancel: () => void;
}

export const UpdateStakeholderModal: React.FC<UpdateStakeholderModalProps> = ({
  stakeholder,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateStakeholder")}
      variant={ModalVariant.medium}
      isOpen={!!stakeholder}
      onClose={onCancel}
    >
      <StakeholderForm
        stakeholder={stakeholder}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
