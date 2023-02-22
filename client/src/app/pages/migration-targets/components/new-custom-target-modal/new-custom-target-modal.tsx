import React from "react";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { CustomTargetForm } from "../../custom-target-form";
import { AxiosResponse } from "axios";
import { RuleBundle } from "@app/api/models";

export interface NewCustomTargetModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<RuleBundle>) => void;
  onCancel: () => void;
}

export const NewCustomTargetModal: React.FC<NewCustomTargetModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  return (
    <Modal
      title="New custom Target"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <CustomTargetForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
