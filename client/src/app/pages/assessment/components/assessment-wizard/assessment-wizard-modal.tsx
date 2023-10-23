import { Modal, ModalVariant } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { AssessmentWizard } from "./assessment-wizard";
import { useFetchAssessmentById } from "@app/queries/assessments";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

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
          aria-label="Application assessment wizard modal"
          hasNoBodyWrapper
          onEscapePress={onRequestClose}
          variant={ModalVariant.large}
        >
          <ConditionalRender
            when={!assessment || isFetching}
            then={<AppPlaceholder />}
          >
            <AssessmentWizard
              assessment={assessment}
              fetchError={fetchError}
              onClose={onRequestClose}
            />
          </ConditionalRender>
        </Modal>
      )}
    </>
  );
};

export default AssessmentModal;
