import * as React from "react";
import { AxiosResponse } from "axios";
import { Modal, ModalVariant } from "@patternfly/react-core";

import { WaveForm } from "./wave-form";
import { Wave } from "@app/api/models";

export interface CreateEditWaveModalProps {
  isOpen: boolean;
  waveBeingEdited: Wave | null;
  onSaved: (response: AxiosResponse<unknown>) => void;
  onCancel: () => void;
}

export const CreateEditWaveModal: React.FC<CreateEditWaveModalProps> = ({
  isOpen,
  waveBeingEdited,
  onSaved,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <Modal
      title={!waveBeingEdited ? "Create migration wave" : "Edit migration wave"}
      variant={ModalVariant.small}
      isOpen
      onClose={onCancel}
    >
      <WaveForm onCancel={onCancel} />
    </Modal>
  );
};
