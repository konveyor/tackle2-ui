import * as React from "react";
import { AxiosResponse } from "axios";
import { Modal, ModalVariant } from "@patternfly/react-core";

import { WaveForm } from "./wave-form";

export interface CreateEditWaveModalProps {
  mode: "create" | "edit" | null; // TODO should we just drive this from waveBeingEdited and an open boolean?
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
      variant={ModalVariant.small}
      isOpen
      onClose={onCancel}
    >
      <WaveForm onCancel={onCancel} />
    </Modal>
  );
};
