import { FunctionComponent, useCallback, useContext } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Button } from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";
import { Td } from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import {
  Application,
  Archetype,
  AssessmentWithSectionOrder,
  InitialAssessment,
  Questionnaire,
} from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import useIsArchetype from "@app/hooks/useIsArchetype";
import {
  addSectionOrderToQuestions,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import "./dynamic-assessment-actions-row.css";

enum AssessmentAction {
  Take = "Take",
  Retake = "Retake",
  Continue = "Continue",
}

interface DynamicAssessmentActionsRowProps {
  questionnaire: Questionnaire;
  application?: Application;
  archetype?: Archetype;
  assessment?: AssessmentWithSectionOrder;
  isReadonly?: boolean;
  onOpenModal: (assessment: AssessmentWithSectionOrder) => void;
}

const DynamicAssessmentActionsRow: FunctionComponent<
  DynamicAssessmentActionsRowProps
> = ({
  questionnaire,
  application,
  archetype,
  assessment,
  isReadonly,
  onOpenModal,
}) => {
  const isArchetype = useIsArchetype();
  const history = useHistory();
  const { t } = useTranslation();

  const { pushNotification } = useContext(NotificationsContext);

  const onSuccessHandler = () => {};
  const onErrorHandler = () => {};

  const { mutateAsync: createAssessmentAsync, isLoading: isCreating } =
    useCreateAssessmentMutation(isArchetype, onSuccessHandler, onErrorHandler);

  const onDeleteAssessmentSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.assessmentDiscarded", {
        application: name,
      }),
      variant: "success",
    });
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteAssessment, isLoading: isDeleting } =
    useDeleteAssessmentMutation(onDeleteAssessmentSuccess, onDeleteError);

  const determineAction = useCallback(() => {
    if (!assessment) {
      return AssessmentAction.Take;
    } else if (assessment.status === "started") {
      return AssessmentAction.Continue;
    } else {
      return AssessmentAction.Retake;
    }
  }, [assessment]);

  const action = determineAction();

  const determineButtonClassName = useCallback(() => {
    if (action === AssessmentAction.Continue) {
      return "continue-button";
    } else if (action === AssessmentAction.Retake) {
      return "retake-button";
    }
    return "";
  }, [action]);

  const createAssessment = async () => {
    const newAssessment: InitialAssessment = {
      questionnaire: { name: questionnaire.name, id: questionnaire.id },
      ...(isArchetype
        ? archetype
          ? { archetype: { name: archetype.name, id: archetype.id } }
          : {}
        : application
          ? { application: { name: application.name, id: application.id } }
          : {}),
    };

    try {
      const result = await createAssessmentAsync(newAssessment);
      const assessmentWithOrder: AssessmentWithSectionOrder =
        addSectionOrderToQuestions(result);

      onOpenModal(assessmentWithOrder);
    } catch (error) {
      console.error("Error while creating assessment:", error);
      pushNotification({
        title: t("terms.error"),
        variant: "danger",
      });
    }
  };

  const takeAssessment = async () => {
    try {
      createAssessment();
    } catch (error) {
      if (isArchetype) {
        console.error(
          `Error fetching archetype with ID ${archetype?.id}:`,
          error
        );
      } else {
        console.error(
          `Error fetching application with ID ${application?.id}:`,
          error
        );
      }

      pushNotification({
        title: t("terms.error"),
        variant: "danger",
      });
    }
  };

  const onHandleAssessmentAction = async () => {
    const action = determineAction();

    if (action === AssessmentAction.Take) {
      takeAssessment();
    } else if (action === AssessmentAction.Continue && assessment?.id) {
      onOpenModal(assessment);
    } else if (action === AssessmentAction.Retake) {
      if (assessment) {
        onOpenModal(assessment);
      }
    }
  };

  const viewButtonLabel = "View";

  return (
    <>
      <Td className="actions-col">
        <div>
          {isReadonly ? null : (
            <Button
              type="button"
              variant="primary"
              className={determineButtonClassName()}
              isDisabled={isCreating || isDeleting}
              isLoading={isCreating || isDeleting}
              onClick={() => {
                onHandleAssessmentAction();
              }}
            >
              {action}
            </Button>
          )}
          {assessment?.status === "complete" ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                history.push(
                  formatPath(
                    isArchetype
                      ? Paths.archetypeAssessmentSummary
                      : Paths.applicationAssessmentSummary,
                    {
                      assessmentId: assessment.id,
                    }
                  )
                );
              }}
            >
              {viewButtonLabel}
            </Button>
          ) : isReadonly ? (
            <Button type="button" variant="secondary" isDisabled={true}>
              {viewButtonLabel}
            </Button>
          ) : null}
        </div>
      </Td>
      {assessment ? (
        <Td isActionCell className="actions-col">
          <Button
            type="button"
            variant="plain"
            onClick={() => {
              deleteAssessment({
                assessmentId: assessment.id,
                applicationName: application?.name,
                applicationId: application?.id,
                archetypeName: archetype?.name,
                archetypeId: archetype?.id,
              });
            }}
          >
            <TrashIcon />
          </Button>
        </Td>
      ) : null}
    </>
  );
};

export default DynamicAssessmentActionsRow;
