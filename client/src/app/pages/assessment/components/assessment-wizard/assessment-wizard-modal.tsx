import { Modal, ModalVariant } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { AssessmentWizard } from "./assessment-wizard";
import { useFetchAssessmentById } from "@app/queries/assessments";

interface AssessmentModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  assessmentId: number;
}

const AssessmentModal: FunctionComponent<AssessmentModalProps> = ({
  isOpen,
  onRequestClose,
  assessmentId,
}) => {
  const { assessment, isFetching, fetchError } =
    useFetchAssessmentById(assessmentId);

  return (
    <>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={onRequestClose}
          showClose={false}
          aria-label="Application assessment wizard modal"
          hasNoBodyWrapper
          onEscapePress={onRequestClose}
          variant={ModalVariant.large}
        >
          <AssessmentWizard
            assessment={assessment}
            fetchError={fetchError}
            isFetching={isFetching}
            onClose={onRequestClose}
          />
        </Modal>
      )}
    </>
  );
};

export default AssessmentModal;
