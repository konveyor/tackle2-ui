import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { StakeholderGroup } from "@app/api/models";

import { StakeholderGroupForm } from "../stakeholder-group-form";

export interface UpdateStakeholderGroupModalProps {
  stakeholderGroup?: StakeholderGroup;
  onSaved: (response: AxiosResponse<StakeholderGroup>) => void;
  onCancel: () => void;
}

export const UpdateStakeholderGroupModal: React.FC<
  UpdateStakeholderGroupModalProps
> = ({ stakeholderGroup, onSaved, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateStakeholderGroup")}
      variant={ModalVariant.medium}
      isOpen={!!stakeholderGroup}
      onClose={onCancel}
    >
      <StakeholderGroupForm
        stakeholderGroup={stakeholderGroup}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
