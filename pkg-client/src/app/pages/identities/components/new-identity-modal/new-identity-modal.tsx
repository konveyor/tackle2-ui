import React from "react";
import { AxiosResponse } from "axios";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { IdentityForm } from "../identity-form";
import { Identity } from "@app/api/models";
import { validateXML } from "../identity-form/validateXML";

export interface NewIdentityModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
}

export const NewIdentityModal: React.FC<NewIdentityModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  return (
    <Modal
      title="New credential"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <IdentityForm
        onSaved={onSaved}
        onCancel={onCancel}
        xmlValidator={validateXML}
      />
    </Modal>
  );
};
