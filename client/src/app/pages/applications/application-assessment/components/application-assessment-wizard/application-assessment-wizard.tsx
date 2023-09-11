import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { FieldErrors, FormProvider, useForm } from "react-hook-form";
import { ButtonVariant } from "@patternfly/react-core";
import { Wizard, WizardStep } from "@patternfly/react-core/deprecated";

import {
  Assessment,
  AssessmentStatus,
  Question,
  Section,
} from "@app/api/models";
import { AssessmentStakeholdersForm } from "../assessment-stakeholders-form";
import { CustomWizardFooter } from "../custom-wizard-footer";
import { getApplicationById } from "@app/api/rest";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { WizardStepNavDescription } from "../wizard-step-nav-description";
import { QuestionnaireForm } from "../questionnaire-form";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import {
  QuestionnairesQueryKey,
  useFetchQuestionnaires,
} from "@app/queries/questionnaires";
import {
  COMMENTS_KEY,
  QUESTIONS_KEY,
  getCommentFieldName,
  getQuestionFieldName,
} from "../../form-utils";
import { AxiosError } from "axios";
import {
  assessmentQueryKey,
  assessmentsByAppIdQueryKey,
  assessmentsQueryKey,
  useUpdateAssessmentMutation,
} from "@app/queries/assessments";
import { useQueryClient } from "@tanstack/react-query";
import { ApplicationAssessmentStatus } from "@app/pages/applications/components/application-assessment-status";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { Paths } from "@app/Paths";

export const SAVE_ACTION_KEY = "saveAction";

export enum SAVE_ACTION_VALUE {
  SAVE,
  SAVE_AND_REVIEW,
  SAVE_AS_DRAFT,
}

export interface ApplicationAssessmentWizardValues {
  stakeholders: number[];
  stakeholderGroups: number[];
  [COMMENTS_KEY]: {
    [key: string]: string; // <categoryId, commentValue>
  };
  [QUESTIONS_KEY]: {
    [key: string]: string | undefined; // <questionId, optionId>
  };
  [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE;
}

export interface ApplicationAssessmentWizardProps {
  assessment?: Assessment;
  isOpen: boolean;
}

export const ApplicationAssessmentWizard: React.FC<
  ApplicationAssessmentWizardProps
> = ({ assessment, isOpen }) => {
  const queryClient = useQueryClient();
  const { questionnaires } = useFetchQuestionnaires();
  const onHandleUpdateAssessmentSuccess = () => {
    queryClient.invalidateQueries([
      assessmentsByAppIdQueryKey,
      assessment?.application?.id,
    ]);
  };
  const { mutate: updateAssessmentMutation } = useUpdateAssessmentMutation(
    onHandleUpdateAssessmentSuccess
  );

  const matchingQuestionnaire = questionnaires.find(
    (questionnaire) => questionnaire.id === assessment?.questionnaire?.id
  );

  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<boolean>(false);

  const history = useHistory();

  const { pushNotification } = React.useContext(NotificationsContext);

  const sortedSections = useMemo(() => {
    return (matchingQuestionnaire ? matchingQuestionnaire.sections : []).sort(
      (a, b) => a.order - b.order
    );
  }, [matchingQuestionnaire]);

  //TODO: Add comments to the sections when/if available from api
  // const initialComments = useMemo(() => {
  //   let comments: { [key: string]: string } = {};
  //   if (assessment) {
  //     assessment.questionnaire.categories.forEach((category) => {
  //       comments[getCommentFieldName(category, false)] = category.comment || "";
  //     });
  //   }
  //   return comments;
  // }, [assessment]);

  const initialQuestions = useMemo(() => {
    const questions: { [key: string]: string | undefined } = {};
    if (assessment && matchingQuestionnaire) {
      matchingQuestionnaire.sections
        .flatMap((f) => f.questions)
        .forEach((question) => {
          const existingAnswer = assessment.sections
            ?.flatMap((section) => section.questions)
            .find((q) => q.text === question.text)
            ?.answers.find((a) => a.selected === true);

          questions[getQuestionFieldName(question, false)] =
            existingAnswer?.text || "";
        });
    }
    return questions;
  }, [assessment, matchingQuestionnaire]);

  useEffect(() => {
    methods.reset({
      // stakeholders: assessment?.stakeholders || [],
      // stakeholderGroups: assessment?.stakeholderGroups || [],
      // comments: initialComments,
      questions: initialQuestions,
      [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
    });
  }, [initialQuestions]);

  const methods = useForm<ApplicationAssessmentWizardValues>({
    defaultValues: useMemo(() => {
      return {
        // stakeholders: assessment?.stakeholders || [],
        // stakeholderGroups: assessment?.stakeholderGroups || [],
        // comments: initialComments,
        questions: initialQuestions,
        [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
      };
    }, [assessment]),
    mode: "all",
  });
  const values = methods.getValues();

  const errors = methods.formState.errors;
  const isValid = methods.formState.isValid;
  const isSubmitting = methods.formState.isSubmitting;
  const isValidating = methods.formState.isValidating;

  const watchAllFields = methods.watch();

  const disableNavigation = !isValid || isSubmitting;

  const isFirstStepValid = () => {
    // TODO: Wire up stakeholder support for assessment when available
    // const numberOfStakeholdlers = values.stakeholders.length;
    // const numberOfGroups = values.stakeholderGroups.length;
    // return numberOfStakeholdlers + numberOfGroups > 0;
    return true;
  };

  const isQuestionValid = (question: Question): boolean => {
    const questionErrors = errors.questions || {};
    return !questionErrors[getQuestionFieldName(question, false)];
  };

  //TODO: Add comments to the sections
  // const isCommentValid = (category: QuestionnaireCategory): boolean => {
  //   const commentErrors = errors.comments || {};
  //   return !commentErrors[getCommentFieldName(category, false)];
  // };

  const questionHasValue = (question: Question): boolean => {
    const questionValues = values.questions || {};
    const value = questionValues[getQuestionFieldName(question, false)];
    return value !== null && value !== undefined;
  };
  //TODO: Add comments to the sections
  // const commentMinLenghtIs1 = (category: QuestionnaireCategory): boolean => {
  //   const categoryComments = values.comments || {};
  //   const value = categoryComments[getCommentFieldName(category, false)];
  //   return value !== null && value !== undefined && value.length > 0;
  // };

  const shouldNextBtnBeEnabled = (section: Section): boolean => {
    return (
      section.questions.every((question) => isQuestionValid(question)) &&
      section.questions.every((question) => questionHasValue(question))
      //  && isCommentValid(category)
    );
  };

  const maxCategoryWithData = [...sortedSections].reverse().find((section) => {
    return section.questions.some((question) => questionHasValue(question));
    //  ||commentMinLenghtIs1(category)
  });
  const canJumpTo = maxCategoryWithData
    ? sortedSections.findIndex((f) => f.name === maxCategoryWithData.name) + 1
    : 0;

  const onInvalid = (errors: FieldErrors<ApplicationAssessmentWizardValues>) =>
    console.error("form errors", errors);

  const buildSectionsFromFormValues = (
    formValues: ApplicationAssessmentWizardValues
  ): Section[] => {
    if (!formValues || !formValues[QUESTIONS_KEY]) {
      return [];
    }
    const updatedQuestionsData = formValues[QUESTIONS_KEY];

    // Create an array of sections based on the questionsData
    const sections: Section[] =
      matchingQuestionnaire?.sections?.map((section) => {
        //TODO: Add comments to the sections
        // const commentValues = values["comments"];
        // const fieldName = getCommentFieldName(category, false);
        // const commentValue = commentValues[fieldName];
        return {
          ...section,
          // comment: commentValue,
          questions: section.questions.map((question) => {
            return {
              ...question,
              answers: question.answers.map((option) => {
                const fieldName = getQuestionFieldName(question, false);
                const questionAnswerValue = updatedQuestionsData[fieldName];
                return {
                  ...option,
                  selected: questionAnswerValue === option.text,
                };
              }),
            };
          }),
        };
      }) || [];
    return sections;
  };

  const handleSaveAsDraft = async (
    formValues: ApplicationAssessmentWizardValues
  ) => {
    try {
      if (!assessment?.application?.id) {
        console.log("An assessment must exist in order to save as draft");
        return;
      }
      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const assessmentStatus: AssessmentStatus = "started";
      const payload: Assessment = {
        ...assessment,
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved as a draft.",
        variant: "info",
      });
      history.push(
        formatPath(Paths.assessmentActions, {
          applicationId: assessment?.application?.id,
        })
      );
    } catch (error) {
      pushNotification({
        title: "Failed to save as a draft.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const handleSave = async (formValues: ApplicationAssessmentWizardValues) => {
    try {
      if (!assessment?.application?.id) {
        console.log("An assessment must exist in order to save.");
        return;
      }
      const assessmentStatus: AssessmentStatus = "complete";
      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const payload: Assessment = {
        ...assessment,
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved.",
        variant: "success",
      });

      history.push(
        formatPath(Paths.assessmentActions, {
          applicationId: assessment?.application?.id,
        })
      );
    } catch (error) {
      pushNotification({
        title: "Failed to save.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const handleSaveAndReview = async (
    formValues: ApplicationAssessmentWizardValues
  ) => {
    try {
      if (!assessment?.application?.id) {
        console.log("An assessment must exist in order to save.");
        return;
      }

      const assessmentStatus: AssessmentStatus = "complete";

      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const payload: Assessment = {
        ...assessment,
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);

      pushNotification({
        title: "Assessment has been saved.",
        variant: "success",
      });

      assessment?.application?.id &&
        getApplicationById(assessment.application.id)
          .then((data) => {
            history.push(
              formatPath(Paths.applicationsReview, {
                applicationId: data.id,
              })
            );
          })
          .catch((error) => {
            pushNotification({
              title: getAxiosErrorMessage(error),
              variant: "danger",
            });
          });
    } catch (error) {
      pushNotification({
        title: "Failed to save.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const onSubmit = async (formValues: ApplicationAssessmentWizardValues) => {
    if (!assessment?.application?.id) {
      console.log("An assessment must exist in order to save the form");
      return;
    }

    const saveAction = formValues[SAVE_ACTION_KEY];

    switch (saveAction) {
      case SAVE_ACTION_VALUE.SAVE:
        handleSave(formValues);
        break;
      case SAVE_ACTION_VALUE.SAVE_AS_DRAFT:
        await handleSaveAsDraft(formValues);
        break;
      case SAVE_ACTION_VALUE.SAVE_AND_REVIEW:
        handleSaveAndReview(formValues);
        break;
      default:
        break;
    }
  };

  const wizardSteps: WizardStep[] = [
    {
      id: 0,
      name: t("composed.selectMany", {
        what: t("terms.stakeholders").toLowerCase(),
      }),
      component: <AssessmentStakeholdersForm />,
      canJumpTo: 0 === currentStep || !disableNavigation,
      enableNext: isFirstStepValid(),
    },
    ...sortedSections.map((section, index) => {
      const stepIndex = index + 1;

      return {
        id: stepIndex,
        name: section.name,
        stepNavItemProps: {
          children: <WizardStepNavDescription section={section} />,
        },
        component: <QuestionnaireForm key={section.name} section={section} />,
        canJumpTo:
          stepIndex === currentStep ||
          (stepIndex <= canJumpTo && !disableNavigation),
        enableNext: shouldNextBtnBeEnabled(section),
      } as WizardStep;
    }),
  ];

  const wizardFooter = (
    <CustomWizardFooter
      isFirstStep={currentStep === 0}
      isLastStep={currentStep === sortedSections.length}
      isDisabled={isSubmitting || isValidating}
      isFormInvalid={!isValid}
      onSave={(review) => {
        const saveActionValue = review
          ? SAVE_ACTION_VALUE.SAVE_AND_REVIEW
          : SAVE_ACTION_VALUE.SAVE;

        methods.setValue(SAVE_ACTION_KEY, saveActionValue);

        methods.handleSubmit(onSubmit, onInvalid)();
      }}
      onSaveAsDraft={() => {
        methods.setValue(SAVE_ACTION_KEY, SAVE_ACTION_VALUE.SAVE_AS_DRAFT);
        methods.handleSubmit(onSubmit)();
      }}
    />
  );

  return (
    <>
      {isOpen && (
        <FormProvider {...methods}>
          <Wizard
            navAriaLabel="assessment-wizard"
            mainAriaLabel="assesment-wizard"
            steps={wizardSteps}
            footer={wizardFooter}
            onNext={() => setCurrentStep((current) => current + 1)}
            onBack={() => setCurrentStep((current) => current - 1)}
            onClose={() => {
              setIsConfirmDialogOpen(true);
            }}
            onGoToStep={(step) => setCurrentStep(step.id as number)}
          />
          {isConfirmDialogOpen && (
            <ConfirmDialog
              title={t("dialog.title.leavePage")}
              isOpen
              message={t("dialog.message.leavePage")}
              confirmBtnVariant={ButtonVariant.primary}
              confirmBtnLabel={t("actions.continue")}
              cancelBtnLabel={t("actions.cancel")}
              onCancel={() => setIsConfirmDialogOpen(false)}
              onClose={() => setIsConfirmDialogOpen(false)}
              onConfirm={() => {
                setIsConfirmDialogOpen(false);
                history.push(
                  formatPath(Paths.assessmentActions, {
                    applicationId: assessment?.application?.id,
                  })
                );
              }}
            />
          )}
        </FormProvider>
      )}
    </>
  );
};
