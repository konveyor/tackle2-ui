import { FunctionComponent } from "react";
import { Modal } from "@patternfly/react-core";

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
          aria-label="Application assessment wizard modal"
          onEscapePress={onRequestClose}
          variant="large"
        >
          <AssessmentWizard assessment={assessment} onClose={onRequestClose} />
        </Modal>
      )}
    </>
  );
};

export default AssessmentModal;
