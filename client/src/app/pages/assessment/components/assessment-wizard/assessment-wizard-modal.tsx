import { FunctionComponent } from "react";
import { Modal, ModalBody, ModalVariant } from "@patternfly/react-core";

import { AssessmentWithSectionOrder } from "@app/api/models";

import { AssessmentWizard } from "./assessment-wizard";

interface AssessmentModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  assessment: AssessmentWithSectionOrder | null;
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
          aria-label="Application assessment wizard modal"
          onEscapePress={onRequestClose}
          variant={ModalVariant.large}
        >
          <ModalBody>
            <AssessmentWizard
              assessment={assessment}
              onClose={onRequestClose}
            />
          </ModalBody>
        </Modal>
      )}
    </>
  );
};

export default AssessmentModal;
