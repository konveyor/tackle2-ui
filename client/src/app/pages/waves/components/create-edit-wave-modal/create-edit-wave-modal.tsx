import React from "react";
import { AxiosResponse } from "axios";

import { Modal, ModalVariant } from "@patternfly/react-core";

export interface CreateEditWaveModalProps {
  mode: "create" | "edit" | null;
  onSaved: (response: AxiosResponse<unknown>) => void;
  onCancel: () => void;
}

export const CreateEditWaveModal: React.FC<CreateEditWaveModalProps> = ({
  mode,
  onSaved,
  onCancel,
}) => {
  if (mode === null) return null;
  return (
    <Modal
      title={
        mode === "create" ? "Create migration wave" : "Edit migration wave"
      }
      variant={ModalVariant.medium}
      isOpen
      onClose={onCancel}
    >
      TODO
    </Modal>
  );
};
