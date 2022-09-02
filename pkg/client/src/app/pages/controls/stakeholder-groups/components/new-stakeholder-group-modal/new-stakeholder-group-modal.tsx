import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { StakeholderGroup } from "@app/api/models";

import { StakeholderGroupForm } from "../stakeholder-group-form";

export interface NewStakeholderGroupModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<StakeholderGroup>) => void;
  onCancel: () => void;
}

export const NewStakeholderGroupModal: React.FC<
  NewStakeholderGroupModalProps
> = ({ isOpen, onSaved, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newStakeholderGroup")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <StakeholderGroupForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
