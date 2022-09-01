import React from "react";
import { AxiosResponse } from "axios";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Identity } from "@app/api/models";
import { IdentityForm } from "../identity-form";

export interface UpdateIdentityModalProps {
  identity?: Identity;
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
}

export const UpdateIdentityModal: React.FC<UpdateIdentityModalProps> = ({
  identity,
  onSaved,
  onCancel,
}) => {
  return (
    <Modal
      title="Update credential"
      variant={ModalVariant.medium}
      isOpen={!!identity}
      onClose={onCancel}
    >
      <IdentityForm identity={identity} onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
