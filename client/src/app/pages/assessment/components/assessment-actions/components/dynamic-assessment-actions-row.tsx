import { Paths } from "@app/Paths";
import {
  Application,
  Archetype,
  Assessment,
  InitialAssessment,
  Questionnaire,
  Ref,
} from "@app/api/models";
import {
  assessmentsByItemIdQueryKey,
  useCreateAssessmentMutation,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { Button, ButtonVariant } from "@patternfly/react-core";
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
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { getAssessmentsByItemId } from "@app/api/rest";
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
}

const DynamicAssessmentActionsRow: FunctionComponent<
  DynamicAssessmentActionsRowProps
> = ({ questionnaire, application, archetype, assessment }) => {
  const isArchetype = useIsArchetype();
  const history = useHistory();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { pushNotification } = React.useContext(NotificationsContext);

  const [archetypeRefToOverride, setArchetypeRefToOverride] =
    React.useState<Ref | null>(null);

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
          const assessments = await getAssessmentsByItemId(
            true,
            archetypeRef.id
          );

          if (assessments && assessments.length > 0) {
            setArchetypeRefToOverride(archetypeRef);
            break;
          } else {
            createAssessment();
          }
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
            name: assessment.name,
            id: assessment.id,
          }).then(() => {
            createAssessment();
          });
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
                id: assessment.id,
                name: assessment.name,
              });
            }}
          >
            <TrashIcon />
          </Button>
        </Td>
      ) : null}
      <ConfirmDialog
        title={t("composed.editQuestion", {
          what: t("terms.assessment").toLowerCase(),
        })}
        alertMessage={t("message.overrideAssessmentDescription", {
          what: archetypeRefToOverride?.name || "Archetype name",
        })}
        message={t("message.overrideAssessmentConfirmation")}
        titleIconVariant={"warning"}
        isOpen={archetypeRefToOverride !== null}
        confirmBtnVariant={ButtonVariant.primary}
        confirmBtnLabel={t("actions.override")}
        cancelBtnLabel={t("actions.cancel")}
        customActionLabel={t("actions.viewArchetypes")}
        onCancel={() => setArchetypeRefToOverride(null)}
        onClose={() => setArchetypeRefToOverride(null)}
        //TODO
        // onCustomAction={() => {
        //   //nav to view archetypes
        //   console.log("nav to view archetypes");
        // }}
        onConfirm={() => {
          history.push(
            formatPath(Paths.applicationsAssessment, {
              assessmentId: archetypeRefToOverride?.id,
            })
          );
          setArchetypeRefToOverride(null);
          createAssessment();
        }}
      />
    </>
  );
};

export default DynamicAssessmentActionsRow;
