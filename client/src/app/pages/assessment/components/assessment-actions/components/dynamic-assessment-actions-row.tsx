import { Paths } from "@app/Paths";
import {
  Application,
  Archetype,
  Assessment,
  InitialAssessment,
  Questionnaire,
} from "@app/api/models";
import {
  assessmentsByItemIdQueryKey,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { Button } from "@patternfly/react-core";
import React, { FunctionComponent } from "react";
import { useHistory } from "react-router-dom";
import "./dynamic-assessment-actions-row.css";
import { AxiosError } from "axios";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { Td } from "@patternfly/react-table";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "@patternfly/react-icons";
import useIsArchetype from "@app/hooks/useIsArchetype";

enum AssessmentAction {
  Take = "Take",
  Retake = "Retake",
  Continue = "Continue",
}

interface DynamicAssessmentActionsRowProps {
  questionnaire: Questionnaire;
  application?: Application;
  archetype?: Archetype;
  assessment?: Assessment;
  isReadonly?: boolean;
}

const DynamicAssessmentActionsRow: FunctionComponent<
  DynamicAssessmentActionsRowProps
> = ({ questionnaire, application, archetype, assessment, isReadonly }) => {
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
    queryClient.invalidateQueries([assessmentsByItemIdQueryKey]);
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );

  const { mutateAsync: deleteAssessmentAsync } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );

  const determineAction = () => {
    if (!assessment) {
      return AssessmentAction.Take;
    } else if (assessment.status === "started") {
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
      if (isArchetype) {
        history.push(
          formatPath(Paths.archetypesAssessment, {
            assessmentId: result.id,
          })
        );
      } else {
        history.push(
          formatPath(Paths.applicationsAssessment, {
            assessmentId: result.id,
          })
        );
      }
    } catch (error) {
      console.error("Error while creating assessment:", error);
      pushNotification({
        title: t("terms.error"),
        variant: "danger",
      });
    }
  };

  const takeAssessment = async () => {
    if (!isArchetype && application?.archetypes?.length) {
      for (const archetypeRef of application.archetypes) {
        try {
          createAssessment();
        } catch (error) {
          console.error(
            `Error fetching archetype with ID ${archetypeRef.id}:`,
            error
          );
          pushNotification({
            title: t("terms.error"),
            variant: "danger",
          });
        }
      }
    } else {
      createAssessment();
    }
  };

  const onHandleAssessmentAction = async () => {
    const action = determineAction();

    if (action === AssessmentAction.Take) {
      takeAssessment();
    } else if (action === AssessmentAction.Continue) {
      history.push(
        formatPath(
          isArchetype
            ? Paths.archetypesAssessment
            : Paths.applicationsAssessment,
          {
            assessmentId: assessment?.id,
          }
        )
      );
    } else if (action === AssessmentAction.Retake) {
      if (assessment) {
        try {
          await deleteAssessmentAsync({
            assessmentId: assessment.id,
            applicationName: application?.name,
            applicationId: application?.id,
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
      <Td>
        <div>
          {!isReadonly ? (
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
          ) : null}
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
        <Td isActionCell>
          <Button
            type="button"
            variant="plain"
            onClick={() => {
              deleteAssessment({
                assessmentId: assessment.id,
                applicationName: application?.name,
                applicationId: application?.id,
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
