import { Paths } from "@app/Paths";
import {
  Application,
  Assessment,
  InitialAssessment,
  Questionnaire,
} from "@app/api/models";
import {
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { Button } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { useHistory } from "react-router-dom";
import "./dynamic-assessment-button.css";
import { AxiosError } from "axios";
import { formatPath } from "@app/utils/utils";

enum AssessmentAction {
  Take = "Take",
  Retake = "Retake",
  Continue = "Continue",
}

interface DynamicAssessmentButtonProps {
  questionnaire: Questionnaire;
  application: Application;
  assessments?: Assessment[];
}

const DynamicAssessmentButton: FunctionComponent<
  DynamicAssessmentButtonProps
> = ({ questionnaire, assessments, application }) => {
  const history = useHistory();
  console.log("assessments", assessments);
  const matchingAssessment = assessments?.find(
    (assessment) => assessment.questionnaire.id === questionnaire.id
  );
  console.log("matchingAssessment", matchingAssessment?.status);

  const onSuccessHandler = () => {};
  const onErrorHandler = () => {};

  const { mutateAsync: createAssessmentAsync } = useCreateAssessmentMutation(
    onSuccessHandler,
    onErrorHandler
  );

  const onDeleteAssessmentSuccess = (name: string) => {};

  const onDeleteError = (error: AxiosError) => {};

  const { mutateAsync: deleteAssessmentAsync } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );
  console.log("matchingAssessment", matchingAssessment);
  const determineAction = () => {
    if (!matchingAssessment || matchingAssessment.status === "empty") {
      return AssessmentAction.Take;
    } else if (matchingAssessment.status === "started") {
      return AssessmentAction.Continue;
    } else {
      return AssessmentAction.Retake;
    }
  };

  const determineButtonClassName = () => {
    const action = determineAction();
    if (action === AssessmentAction.Continue) {
      return "continue-button";
    } else if (action === AssessmentAction.Retake) {
      return "retake-button";
    }
  };
  const createAssessment = async () => {
    const newAssessment: InitialAssessment = {
      questionnaire: { name: questionnaire.name, id: questionnaire.id },
      application: { name: application?.name, id: application?.id },
      // TODO handle archetypes here too
    };

    try {
      const result = await createAssessmentAsync(newAssessment);
      history.push(
        formatPath(Paths.applicationsAssessment, {
          assessmentId: result.id,
        })
      );
    } catch (error) {
      console.error("Error while creating assessment:", error);
    }
  };
  const onHandleAssessmentAction = async () => {
    const action = determineAction();

    if (action === AssessmentAction.Take) {
      createAssessment();
    } else if (action === AssessmentAction.Continue) {
      history.push(
        formatPath(Paths.applicationsAssessment, {
          assessmentId: matchingAssessment?.id,
        })
      );
    } else if (action === AssessmentAction.Retake) {
      if (matchingAssessment) {
        try {
          await deleteAssessmentAsync({
            name: matchingAssessment.name,
            id: matchingAssessment.id,
          }).then(() => {
            createAssessment();
          });
          history.push(
            formatPath(Paths.applicationsAssessment, {
              assessmentId: matchingAssessment?.id,
            })
          );
        } catch (error) {
          console.error("Error while deleting assessment:", error);
        }
      }
    }
  };

  const viewButtonLabel = "View";

  return (
    <div>
      <Button
        type="button"
        variant="primary"
        className={determineButtonClassName()}
        onClick={() => {
          onHandleAssessmentAction();
        }}
      >
        {determineAction()}
      </Button>
      {matchingAssessment?.status === "complete" && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            history.push(
              formatPath(Paths.assessmentSummary, {
                assessmentId: matchingAssessment.id,
              })
            );
          }}
        >
          {viewButtonLabel}
        </Button>
      )}
    </div>
  );
};

export default DynamicAssessmentButton;
