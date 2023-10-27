import { Modal, ModalVariant } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { AssessmentWizard } from "./assessment-wizard";
import { Assessment } from "@app/api/models";

interface AssessmentModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  assessment: Assessment | null;
}

const AssessmentModal: FunctionComponent<AssessmentModalProps> = ({
  isOpen,
  onRequestClose,
  assessment,
}) => {
  return (
    <>
      {isOpen && assessment && (
        <Modal
          isOpen={isOpen}
          onClose={onRequestClose}
          showClose={false}
          aria-label="Application assessment wizard modal"
          hasNoBodyWrapper
          onEscapePress={onRequestClose}
          variant={ModalVariant.large}
        >
          <AssessmentWizard assessment={assessment} onClose={onRequestClose} />
        </Modal>
      )}
    </>
  );
};

export default AssessmentModal;
