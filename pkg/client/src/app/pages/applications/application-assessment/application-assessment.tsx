import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FormikHelpers, FormikProvider, useFormik } from "formik";
import { AxiosError } from "axios";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { confirmDialogActions } from "@app/store/confirmDialog";

import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
  ButtonVariant,
  Wizard,
  WizardStep,
} from "@patternfly/react-core";
import { BanIcon } from "@patternfly/react-icons/dist/esm/icons/ban-icon";

import {
  ConditionalRender,
  SimpleEmptyState,
  AppPlaceholder,
} from "@app/shared/components";

import { AssessmentRoute, formatPath, Paths } from "@app/Paths";
import {
  Assessment,
  AssessmentStatus,
  Question,
  QuestionnaireCategory,
} from "@app/api/models";
import {
  getApplicationById,
  getAssessmentById,
  patchAssessment,
} from "@app/api/rest";

import { CustomWizardFooter } from "./components/custom-wizard-footer";

import { StakeholdersForm } from "./components/stakeholders-form";
import { QuestionnaireForm } from "./components/questionnaire-form";

import {
  COMMENTS_KEY,
  getCommentFieldName,
  getQuestionFieldName,
  IFormValues,
  QUESTIONS_KEY,
  SAVE_ACTION_KEY,
  SAVE_ACTION_VALUE,
} from "./form-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationAssessmentPage } from "./components/application-assessment-page";
import { WizardStepNavDescription } from "./components/wizard-step-nav-description";

export const ApplicationAssessment: React.FC = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const history = useHistory();
  const { assessmentId } = useParams<AssessmentRoute>();

  const [currentStep, setCurrentStep] = useState(0);

  const [saveError, setSaveError] = useState<AxiosError>();

  // Assessment

  const [assessment, setAssessment] = useState<Assessment>();
  const [isFetchingAssessment, setIsFetchingAssessment] = useState(true);
  const [fetchAssessmentError, setFetchAssessmentError] =
    useState<AxiosError>();

  useEffect(() => {
    if (assessmentId) {
      setIsFetchingAssessment(true);

      getAssessmentById(assessmentId)
        .then(({ data }) => {
          setIsFetchingAssessment(false);
          setAssessment(data);
        })
        .catch((error) => {
          setIsFetchingAssessment(false);
          setFetchAssessmentError(error);
        });
    }
  }, [assessmentId]);

  const sortedCategories = useMemo(() => {
    return (assessment ? assessment.questionnaire.categories : []).sort(
      (a, b) => a.order - b.order
    );
  }, [assessment]);

  //

  const redirectToApplications = () => {
    history.push(Paths.applications);
  };

  const confirmAndRedirectToApplications = () => {
    dispatch(
      confirmDialogActions.openDialog({
        title: t("dialog.title.leavePage"),
        message: t("dialog.message.leavePage"),
        confirmBtnVariant: ButtonVariant.primary,
        confirmBtnLabel: t("actions.continue"),
        cancelBtnLabel: t("actions.cancel"),
        onConfirm: () => {
          dispatch(confirmDialogActions.closeDialog());
          redirectToApplications();
        },
      })
    );
  };

  // Formik

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

  const onSubmit = (
    formValues: IFormValues,
    formikHelpers: FormikHelpers<IFormValues>
  ) => {
    if (!assessment) {
      console.log("An assessment must exist in order to save the form");
      formikHelpers.setSubmitting(false);
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
        categories: assessment.questionnaire.categories.map((category) => {
          const commentValues = formValues[COMMENTS_KEY];

          const fieldName = getCommentFieldName(category, false);
          const commentValue = commentValues[fieldName];
          return {
            ...category,
            comment: commentValue,
            questions: category.questions.map((question) => ({
              ...question,
              options: question.options.map((option) => {
                const questionValues = formValues[QUESTIONS_KEY];

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
        formikHelpers.setSubmitting(false);
        switch (saveAction) {
          case SAVE_ACTION_VALUE.SAVE:
            redirectToApplications();
            break;
          case SAVE_ACTION_VALUE.SAVE_AND_REVIEW:
            getApplicationById(assessment.applicationId)
              .then(({ data }) => {
                formikHelpers.setSubmitting(false);
                history.push(
                  formatPath(Paths.applicationsReview, {
                    applicationId: data.id,
                  })
                );
              })
              .catch((error) => {
                dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
                formikHelpers.setSubmitting(false);
              });
            break;
        }
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setSaveError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      stakeholders: assessment?.stakeholders || [],
      stakeholderGroups: assessment?.stakeholderGroups || [],
      comments: initialComments,
      questions: initialQuestions,
      [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
    },
    onSubmit: onSubmit,
    validate: (values) => {
      // Only validations for Fields that depends on others should go here.
      // Individual field's validation should be defined within each Field
      if (values.stakeholders.length + values.stakeholderGroups.length <= 0) {
        const errorMsg = t("validation.minOneStakeholderOrGroupRequired");
        return {
          stakeholders: errorMsg,
          stakeholderGroups: errorMsg,
        };
      }
      return;
    },
  });

  const isFirstStepValid = () => {
    const numberOfStakeholdlers = formik.values.stakeholders.length;
    const numberOfGroups = formik.values.stakeholderGroups.length;
    return numberOfStakeholdlers + numberOfGroups > 0;
  };

  const isQuestionValid = (question: Question): boolean => {
    const questionErrors = formik.errors.questions || {};
    return !questionErrors[getQuestionFieldName(question, false)];
  };

  const isCommentValid = (category: QuestionnaireCategory): boolean => {
    const commentErrors = formik.errors.comments || {};
    return !commentErrors[getCommentFieldName(category, false)];
  };

  const questionHasValue = (question: Question): boolean => {
    const questionValues = formik.values.questions || {};
    const value = questionValues[getQuestionFieldName(question, false)];
    return value !== null && value !== undefined;
  };

  const commentMinLenghtIs1 = (category: QuestionnaireCategory): boolean => {
    const categoryComments = formik.values.comments || {};
    const value = categoryComments[getCommentFieldName(category, false)];
    return value !== null && value !== undefined && value.length > 0;
  };

  // Wizard

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

  const disableNavigation = !formik.isValid || formik.isSubmitting;

  const wizardSteps: WizardStep[] = [
    {
      id: 0,
      // t('terms.stakeholders')
      name: t("composed.selectMany", {
        what: t("terms.stakeholders").toLowerCase(),
      }),
      component: <StakeholdersForm />,
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
      isDisabled={formik.isSubmitting || formik.isValidating}
      isFormInvalid={!formik.isValid}
      onSave={(review) => {
        const saveActionValue = review
          ? SAVE_ACTION_VALUE.SAVE_AND_REVIEW
          : SAVE_ACTION_VALUE.SAVE;

        formik.setFieldValue(SAVE_ACTION_KEY, saveActionValue);
        formik.submitForm();
      }}
      onSaveAsDraft={() => {
        formik.setFieldValue(SAVE_ACTION_KEY, SAVE_ACTION_VALUE.SAVE_AS_DRAFT);
        formik.submitForm();
      }}
    />
  );

  if (fetchAssessmentError) {
    return (
      <ApplicationAssessmentPage assessment={assessment}>
        <Bullseye>
          <SimpleEmptyState
            icon={BanIcon}
            title={t("message.couldNotFetchTitle")}
            description={t("message.couldNotFetchBody") + "."}
          />
        </Bullseye>
      </ApplicationAssessmentPage>
    );
  }

  return (
    <ApplicationAssessmentPage assessment={assessment}>
      {saveError && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(saveError)}
          actionClose={
            <AlertActionCloseButton onClose={() => setSaveError(undefined)} />
          }
        />
      )}
      <ConditionalRender when={isFetchingAssessment} then={<AppPlaceholder />}>
        <FormikProvider value={formik}>
          <Wizard
            navAriaLabel="assessment-wizard"
            mainAriaLabel="assesment-wizard"
            steps={wizardSteps}
            footer={wizardFooter}
            onNext={() => {
              setCurrentStep((current) => current + 1);
            }}
            onBack={() => {
              setCurrentStep((current) => current - 1);
            }}
            onClose={confirmAndRedirectToApplications}
            onGoToStep={(step) => {
              setCurrentStep(step.id as number);
            }}
          />
        </FormikProvider>
      </ConditionalRender>
    </ApplicationAssessmentPage>
  );
};
