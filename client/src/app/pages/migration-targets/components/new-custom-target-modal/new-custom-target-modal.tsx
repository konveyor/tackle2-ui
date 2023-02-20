import React from "react";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { CustomTargetForm } from "../../custom-target-form";

export interface NewCustomTargetModalProps {
  isOpen: boolean;
  onSaved: (response: number) => void;
  onCancel: () => void;
}

export const NewCustomTargetModal: React.FC<NewCustomTargetModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  return (
    <Modal
      title="New Custom Target"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <CustomTargetForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
