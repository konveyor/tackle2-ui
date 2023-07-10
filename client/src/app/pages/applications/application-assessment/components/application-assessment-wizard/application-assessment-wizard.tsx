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
  QuestionnaireCategory,
} from "@app/api/models";
import {
  COMMENTS_KEY,
  getCommentFieldName,
  getQuestionFieldName,
  QUESTIONS_KEY,
} from "../../form-utils";
import { AssessmentStakeholdersForm } from "../assessment-stakeholders-form";
import { CustomWizardFooter } from "../custom-wizard-footer";
import { getApplicationById, patchAssessment } from "@app/api/rest";
import { formatPath, Paths } from "@app/Paths";
import { NotificationsContext } from "@app/shared/notifications-context";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { WizardStepNavDescription } from "../wizard-step-nav-description";
import { QuestionnaireForm } from "../questionnaire-form";
import { ConfirmDialog } from "@app/shared/components";

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
    [key: string]: number | undefined; // <questionId, optionId>
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
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const history = useHistory();

  const { pushNotification } = React.useContext(NotificationsContext);

  const sortedCategories = useMemo(() => {
    return (assessment ? assessment.questionnaire.categories : []).sort(
      (a, b) => a.order - b.order
    );
  }, [assessment]);

  const initialComments = useMemo(() => {
    let comments: { [key: string]: string } = {};
    if (assessment) {
      assessment.questionnaire.categories.forEach((category) => {
        comments[getCommentFieldName(category, false)] = category.comment || "";
      });
    }
    return comments;
  }, [assessment]);

  const initialQuestions = useMemo(() => {
    let questions: { [key: string]: number | undefined } = {};
    if (assessment) {
      assessment.questionnaire.categories
        .flatMap((f) => f.questions)
        .forEach((question) => {
          questions[getQuestionFieldName(question, false)] =
            question.options.find((f) => f.checked === true)?.id;
        });
    }
    return questions;
  }, [assessment]);

  useEffect(() => {
    methods.reset({
      stakeholders: assessment?.stakeholders || [],
      stakeholderGroups: assessment?.stakeholderGroups || [],
      comments: initialComments,
      questions: initialQuestions,
      [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
    });
  }, [assessment]);

  const methods = useForm<ApplicationAssessmentWizardValues>({
    defaultValues: useMemo(() => {
      return {
        stakeholders: assessment?.stakeholders || [],
        stakeholderGroups: assessment?.stakeholderGroups || [],
        comments: initialComments,
        questions: initialQuestions,
        [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
      };
    }, [assessment]),
    mode: "onChange",
  });
  const values = methods.getValues();

  const errors = methods.formState.errors;
  const isValid = methods.formState.isValid;
  const isSubmitting = methods.formState.isSubmitting;
  const isValidating = methods.formState.isValidating;

  const watchAllFields = methods.watch();

  const disableNavigation = !isValid || isSubmitting;

  const isFirstStepValid = () => {
    const numberOfStakeholdlers = values.stakeholders.length;
    const numberOfGroups = values.stakeholderGroups.length;
    return numberOfStakeholdlers + numberOfGroups > 0;
  };

  const isQuestionValid = (question: Question): boolean => {
    const questionErrors = errors.questions || {};
    return !questionErrors[getQuestionFieldName(question, false)];
  };

  const isCommentValid = (category: QuestionnaireCategory): boolean => {
    const commentErrors = errors.comments || {};
    return !commentErrors[getCommentFieldName(category, false)];
  };

  const questionHasValue = (question: Question): boolean => {
    const questionValues = values.questions || {};
    const value = questionValues[getQuestionFieldName(question, false)];
    return value !== null && value !== undefined;
  };

  const commentMinLenghtIs1 = (category: QuestionnaireCategory): boolean => {
    const categoryComments = values.comments || {};
    const value = categoryComments[getCommentFieldName(category, false)];
    return value !== null && value !== undefined && value.length > 0;
  };

  const shouldNextBtnBeEnabled = (category: QuestionnaireCategory): boolean => {
    return (
      category.questions.every((question) => isQuestionValid(question)) &&
      category.questions.every((question) => questionHasValue(question)) &&
      isCommentValid(category)
    );
  };

  const maxCategoryWithData = [...sortedCategories]
    .reverse()
    .find((category) => {
      return (
        category.questions.some((question) => questionHasValue(question)) ||
        commentMinLenghtIs1(category)
      );
    });
  const canJumpTo = maxCategoryWithData
    ? sortedCategories.findIndex((f) => f.id === maxCategoryWithData.id) + 1
    : 0;

  const onInvalid = (errors: FieldErrors<ApplicationAssessmentWizardValues>) =>
    console.error("form errors", errors);

  const onSubmit = (formValues: ApplicationAssessmentWizardValues) => {
    if (!assessment) {
      console.log("An assessment must exist in order to save the form");
      return;
    }

    const saveAction = formValues[SAVE_ACTION_KEY];
    const assessmentStatus: AssessmentStatus =
      saveAction !== SAVE_ACTION_VALUE.SAVE_AS_DRAFT ? "COMPLETE" : "STARTED";

    const payload: Assessment = {
      ...assessment,
      stakeholders: formValues.stakeholders,
      stakeholderGroups: formValues.stakeholderGroups,
      questionnaire: {
        categories: assessment?.questionnaire.categories.map((category) => {
          const commentValues = values["comments"];

          const fieldName = getCommentFieldName(category, false);
          const commentValue = commentValues[fieldName];
          return {
            ...category,
            comment: commentValue,
            questions: category.questions.map((question) => ({
              ...question,
              options: question.options.map((option) => {
                const questionValues = values["questions"];

                const fieldName = getQuestionFieldName(question, false);
                const questionValue = questionValues[fieldName];
                return {
                  ...option,
                  checked: questionValue === option.id,
                };
              }),
            })),
          };
        }),
      },
      status: assessmentStatus,
    };

    patchAssessment(payload)
      .then(() => {
        switch (saveAction) {
          case SAVE_ACTION_VALUE.SAVE:
            history.push(Paths.applications);
            break;
          case SAVE_ACTION_VALUE.SAVE_AND_REVIEW:
            assessment &&
              getApplicationById(assessment?.applicationId)
                .then(({ data }) => {
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
            break;
        }
      })
      .catch((error) => {
        console.log("Save assessment error:", error);
      });
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
    ...sortedCategories.map((category, index) => {
      const stepIndex = index + 1;

      return {
        id: stepIndex,
        name: category.title,
        stepNavItemProps: {
          children: <WizardStepNavDescription category={category} />,
        },
        component: <QuestionnaireForm key={category.id} category={category} />,
        canJumpTo:
          stepIndex === currentStep ||
          (stepIndex <= canJumpTo && !disableNavigation),
        enableNext: shouldNextBtnBeEnabled(category),
      } as WizardStep;
    }),
  ];

  const wizardFooter = (
    <CustomWizardFooter
      isFirstStep={currentStep === 0}
      isLastStep={currentStep === sortedCategories.length}
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
                history.push(Paths.applications);
              }}
            />
          )}
        </FormProvider>
      )}
    </>
  );
};
