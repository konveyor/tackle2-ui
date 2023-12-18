import { Paths } from "@app/Paths";
import {
  Application,
  Archetype,
  AssessmentWithSectionOrder,
  InitialAssessment,
  Questionnaire,
} from "@app/api/models";
import {
  addSectionOrderToQuestions,
  assessmentsByItemIdQueryKey,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { Button, Spinner } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { useHistory } from "react-router-dom";
import "./dynamic-assessment-actions-row.css";
import { AxiosError } from "axios";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { Td } from "@patternfly/react-table";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useTranslation } from "react-i18next";
import {
  useIsFetching,
  useIsMutating,
  useQueryClient,
} from "@tanstack/react-query";
import { TrashIcon } from "@patternfly/react-icons";
import useIsArchetype from "@app/hooks/useIsArchetype";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

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
  const queryClient = useQueryClient();

  const { pushNotification } = React.useContext(NotificationsContext);

  const onSuccessHandler = () => {};
  const onErrorHandler = () => {};

  const { mutateAsync: createAssessmentAsync } = useCreateAssessmentMutation(
    isArchetype,
    onSuccessHandler,
    onErrorHandler
  );

  const onDeleteAssessmentSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.assessmentDiscarded", {
        application: name,
      }),
      variant: "success",
    });
    queryClient.invalidateQueries([
      assessmentsByItemIdQueryKey,
      application?.id,
      isArchetype,
    ]);
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteAssessment, isLoading: isDeleting } =
    useDeleteAssessmentMutation(onDeleteAssessmentSuccess, onDeleteError);

  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const { mutateAsync: deleteAssessmentAsync } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );

  const determineAction = React.useCallback(() => {
    if (!assessment) {
      return AssessmentAction.Take;
    } else if (assessment.status === "started") {
      return AssessmentAction.Continue;
    } else {
      return AssessmentAction.Retake;
    }
  }, [assessment]);

  const [action, setAction] = React.useState(determineAction());

  React.useEffect(() => {
    setAction(determineAction());
  }, [determineAction, assessment]);

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
        try {
          await deleteAssessmentAsync({
            assessmentId: assessment.id,
            applicationName: application?.name,
            applicationId: application?.id,
            archetypeName: archetype?.name,
            archetypeId: archetype?.id,
          }).then(() => {
            createAssessment();
          });
        } catch (error) {
          pushNotification({
            title: t("terms.error"),
            variant: "danger",
          });
          console.error("Error while deleting assessment:", error);
        }
      }
    }
  };

  const viewButtonLabel = "View";

  return (
    <>
      <Td className="actions-col">
        <div>
          {isReadonly ? null : !isDeleting && !isFetching && !isMutating ? (
            <Button
              type="button"
              variant="primary"
              className={determineButtonClassName()}
              onClick={() => {
                onHandleAssessmentAction();
              }}
            >
              {action}
            </Button>
          ) : (
            <Spinner role="status" size="md" className={spacing.mxLg}>
              <span className="sr-only">Loading...</span>
            </Spinner>
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
