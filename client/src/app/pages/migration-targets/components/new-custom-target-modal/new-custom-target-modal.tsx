import React from "react";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { CustomTargetForm } from "../../custom-target-form";
import { AxiosResponse } from "axios";
import { Ruleset } from "@app/api/models";

export interface NewCustomTargetModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<Ruleset>) => void;
  onCancel: () => void;
}

export const NewCustomTargetModal: React.FC<NewCustomTargetModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  return (
    <Modal
      title="New custom target"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <CustomTargetForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
