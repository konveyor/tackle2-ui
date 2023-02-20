import React from "react";
import { AxiosResponse } from "axios";

import { Modal, ModalVariant } from "@patternfly/react-core";
import { CustomTargetForm } from "../../custom-target-form";
import { RuleBundle } from "@app/api/models";

export interface UpdateCustomTargetModalProps {
  ruleBundle?: RuleBundle;
  onSaved: (response: number) => void;
  onCancel: () => void;
}

export const UpdateCustomTargetModal: React.FC<
  UpdateCustomTargetModalProps
> = ({ ruleBundle, onSaved, onCancel }) => {
  return (
    <Modal
      title="Update identity"
      variant={ModalVariant.medium}
      isOpen={!!ruleBundle}
      onClose={onCancel}
    >
      <CustomTargetForm
        ruleBundle={ruleBundle}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
