import React from "react";
import { AxiosResponse } from "axios";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { CustomTargetForm } from "../../custom-target-form";
import { Ruleset } from "@app/api/models";

export interface UpdateCustomTargetModalProps {
  ruleset?: Ruleset;
  onSaved: (response: AxiosResponse<Ruleset>) => void;
  onCancel: () => void;
}

export const UpdateCustomTargetModal: React.FC<
  UpdateCustomTargetModalProps
> = ({ ruleset, onSaved, onCancel }) => {
  return (
    <Modal
      title="Update custom target"
      variant={ModalVariant.medium}
      isOpen={!!ruleset}
      onClose={onCancel}
    >
      <CustomTargetForm
        ruleset={ruleset}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
