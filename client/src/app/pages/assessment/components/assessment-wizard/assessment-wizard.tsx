import * as yup from "yup";
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
  Ref,
  Section,
} from "@app/api/models";
import { CustomWizardFooter } from "../custom-wizard-footer";
import { getApplicationById, getArchetypeById } from "@app/api/rest";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { WizardStepNavDescription } from "../wizard-step-nav-description";
import { QuestionnaireForm } from "../questionnaire-form";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import {
  COMMENTS_KEY,
  QUESTIONS_KEY,
  getQuestionFieldName,
} from "../../form-utils";
import { AxiosError } from "axios";
import {
  assessmentsByItemIdQueryKey,
  useDeleteAssessmentMutation,
  useUpdateAssessmentMutation,
} from "@app/queries/assessments";
import { useQueryClient } from "@tanstack/react-query";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";
import { Paths } from "@app/Paths";
import { yupResolver } from "@hookform/resolvers/yup";
import { AssessmentStakeholdersForm } from "../assessment-stakeholders-form/assessment-stakeholders-form";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useFetchStakeholderGroups } from "@app/queries/stakeholdergoups";
import { useFetchStakeholders } from "@app/queries/stakeholders";

export const SAVE_ACTION_KEY = "saveAction";

export enum SAVE_ACTION_VALUE {
  SAVE,
  SAVE_AND_REVIEW,
  SAVE_AS_DRAFT,
}

export interface AssessmentWizardValues {
  stakeholders: string[];
  stakeholderGroups: string[];
  [COMMENTS_KEY]: {
    [key: string]: string; // <categoryId, commentValue>
  };
  [QUESTIONS_KEY]: {
    [key: string]: string | undefined; // <questionId, optionId>
  };
  [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE;
}

export interface AssessmentWizardProps {
  assessment?: Assessment;
  isOpen: boolean;
  isLoadingAssessment: boolean;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  assessment,
  isOpen,
  isLoadingAssessment,
}) => {
  const isArchetype = useIsArchetype();
  const queryClient = useQueryClient();
  const { stakeholderGroups } = useFetchStakeholderGroups();
  const { stakeholders } = useFetchStakeholders();

  const onHandleUpdateAssessmentSuccess = () => {
    queryClient.invalidateQueries([
      assessmentsByItemIdQueryKey,
      assessment?.application?.id,
    ]);
  };
  const { mutate: updateAssessmentMutation } = useUpdateAssessmentMutation(
    onHandleUpdateAssessmentSuccess
  );

  const { mutate: deleteAssessmentMutation } = useDeleteAssessmentMutation();

  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);

  const [assessmentToCancel, setAssessmentToCancel] =
    React.useState<Assessment | null>(null);

  const history = useHistory();

  const { pushNotification } = React.useContext(NotificationsContext);

  const sortedSections = useMemo(() => {
    return (assessment ? assessment.sections : []).sort(
      (a, b) => a.order - b.order
    );
  }, [assessment]);

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
    if (assessment) {
      assessment.sections
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
  }, [assessment, isLoadingAssessment]);

  const validationSchema = yup.object().shape({
    stakeholders: yup.array().of(yup.string()),
    stakeholderGroups: yup.array().of(yup.string()),
  });

  const methods = useForm<AssessmentWizardValues>({
    resolver: yupResolver(validationSchema),
    mode: "all",
  });
  const values = methods.getValues();

  useEffect(() => {
    methods.reset({
      stakeholders: assessment?.stakeholders?.map((sh) => sh.name).sort() ?? [],
      stakeholderGroups:
        assessment?.stakeholderGroups?.map((sg) => sg.name).sort() ?? [],
      questions: initialQuestions,
      [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
    });
    return () => {
      methods.reset();
    };
  }, [assessment]);

  const errors = methods.formState.errors;
  const isValid = methods.formState.isValid;
  const isSubmitting = methods.formState.isSubmitting;
  const isValidating = methods.formState.isValidating;
  const watchAllFields = methods.watch();

  const disableNavigation = !isValid || isSubmitting;

  const isFirstStepValid = () => {
    // TODO: Wire up stakeholder support for assessment when available
    const numberOfStakeholdlers = values?.stakeholders?.length || 0;
    const numberOfGroups = values?.stakeholderGroups?.length || 0;
    return numberOfStakeholdlers + numberOfGroups > 0;
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
    return value !== null && value !== undefined && value !== "";
  };
  //TODO: Add comments to the sections
  // const commentMinLenghtIs1 = (category: QuestionnaireCategory): boolean => {
  //   const categoryComments = values.comments || {};
  //   const value = categoryComments[getCommentFieldName(category, false)];
  //   return value !== null && value !== undefined && value.length > 0;
  // };

  const areAllQuestionsAnswered = (section: Section): boolean => {
    return (
      section?.questions.every((question) => {
        return questionHasValue(question);
      }) ?? false
    );
  };

  const hasPartialAnswers = (section: Section): boolean => {
    const someQuestionsAnswered = section?.questions.some((question) => {
      return questionHasValue(question);
    });

    const allQuestionsAnswered = areAllQuestionsAnswered(section);

    return someQuestionsAnswered && !allQuestionsAnswered;
  };

  const shouldNextBtnBeEnabled = (section: Section): boolean => {
    const allQuestionsValid = section?.questions.every((question) =>
      isQuestionValid(question)
    );

    const allQuestionsAnswered = areAllQuestionsAnswered(section);

    return allQuestionsAnswered && allQuestionsValid;
  };

  const maxCategoryWithData = [...sortedSections].reverse().find((section) => {
    return section.questions.some((question) => questionHasValue(question));
    //  ||commentMinLenghtIs1(category)
  });
  const canJumpTo = maxCategoryWithData
    ? sortedSections.findIndex((f) => f.name === maxCategoryWithData.name) + 1
    : 0;

  const onInvalid = (errors: FieldErrors<AssessmentWizardValues>) =>
    console.error("form errors", errors);

  const buildSectionsFromFormValues = (
    formValues: AssessmentWizardValues
  ): Section[] => {
    if (!formValues || !formValues[QUESTIONS_KEY]) {
      return [];
    }
    const updatedQuestionsData = formValues[QUESTIONS_KEY];

    // Create an array of sections based on the questionsData
    const sections: Section[] =
      assessment?.sections?.map((section) => {
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

  const handleSaveAsDraft = async (formValues: AssessmentWizardValues) => {
    try {
      if (!assessment?.application?.id && !assessment?.archetype?.id) {
        console.log("An assessment must exist in order to save as draft");
        return;
      }
      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const assessmentStatus: AssessmentStatus = "started";
      const payload: Assessment = {
        ...assessment,
        stakeholders:
          values.stakeholders === undefined
            ? undefined
            : (values.stakeholders
                .map((name) => stakeholders.find((s) => s.name === name))
                .map<Ref | undefined>((sh) =>
                  !sh ? undefined : { id: sh.id, name: sh.name }
                )
                .filter(Boolean) as Ref[]),

        stakeholderGroups:
          values.stakeholderGroups === undefined
            ? undefined
            : (values.stakeholderGroups
                .map((name) => stakeholderGroups.find((s) => s.name === name))
                .map<Ref | undefined>((sg) =>
                  !sg ? undefined : { id: sg.id, name: sg.name }
                )
                .filter(Boolean) as Ref[]),
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved as a draft.",
        variant: "info",
      });
      if (isArchetype) {
        history.push(
          formatPath(Paths.archetypeAssessmentActions, {
            archetypeId: assessment?.archetype?.id,
          })
        );
      } else {
        history.push(
          formatPath(Paths.applicationAssessmentActions, {
            applicationId: assessment?.application?.id,
          })
        );
      }
    } catch (error) {
      pushNotification({
        title: "Failed to save as a draft.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const handleSave = async (formValues: AssessmentWizardValues) => {
    try {
      if (!assessment?.application?.id && !assessment?.archetype?.id) {
        console.log("An assessment must exist in order to save.");
        return;
      }
      const assessmentStatus: AssessmentStatus = "complete";
      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const payload: Assessment = {
        ...assessment,
        stakeholders:
          values.stakeholders === undefined
            ? undefined
            : (values.stakeholders
                .map((name) => stakeholders.find((s) => s.name === name))
                .map<Ref | undefined>((sh) =>
                  !sh ? undefined : { id: sh.id, name: sh.name }
                )
                .filter(Boolean) as Ref[]),

        stakeholderGroups:
          values.stakeholderGroups === undefined
            ? undefined
            : (values.stakeholderGroups
                .map((name) => stakeholderGroups.find((s) => s.name === name))
                .map<Ref | undefined>((sg) =>
                  !sg ? undefined : { id: sg.id, name: sg.name }
                )
                .filter(Boolean) as Ref[]),
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved.",
        variant: "success",
      });

      if (isArchetype) {
        history.push(
          formatPath(Paths.archetypeAssessmentActions, {
            archetypeId: assessment?.archetype?.id,
          })
        );
      } else {
        history.push(
          formatPath(Paths.applicationAssessmentActions, {
            applicationId: assessment?.application?.id,
          })
        );
      }
    } catch (error) {
      pushNotification({
        title: "Failed to save.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const handleSaveAndReview = async (formValues: AssessmentWizardValues) => {
    try {
      if (!assessment?.application?.id && !assessment?.archetype?.id) {
        console.log("An assessment must exist in order to save.");
        return;
      }

      const assessmentStatus: AssessmentStatus = "complete";

      const sections = assessment
        ? buildSectionsFromFormValues(formValues)
        : [];

      const payload: Assessment = {
        ...assessment,
        stakeholders:
          values.stakeholders === undefined
            ? undefined
            : (values.stakeholders
                .map((name) => stakeholders.find((s) => s.name === name))
                .map<Ref | undefined>((sh) =>
                  !sh ? undefined : { id: sh.id, name: sh.name }
                )
                .filter(Boolean) as Ref[]),

        stakeholderGroups:
          values.stakeholderGroups === undefined
            ? undefined
            : (values.stakeholderGroups
                .map((name) => stakeholderGroups.find((s) => s.name === name))
                .map<Ref | undefined>((sg) =>
                  !sg ? undefined : { id: sg.id, name: sg.name }
                )
                .filter(Boolean) as Ref[]),
        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);

      pushNotification({
        title: "Assessment has been saved.",
        variant: "success",
      });
      if (isArchetype) {
        assessment?.archetype?.id &&
          getArchetypeById(assessment.archetype.id)
            .then((data) => {
              history.push(
                formatPath(Paths.archetypeReview, {
                  archetypeId: data.id,
                })
              );
            })
            .catch((error) => {
              pushNotification({
                title: getAxiosErrorMessage(error),
                variant: "danger",
              });
            });
      } else {
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
      }
    } catch (error) {
      pushNotification({
        title: "Failed to save.",
        variant: "danger",
        message: getAxiosErrorMessage(error as AxiosError),
      });
    }
  };

  const onSubmit = async (formValues: AssessmentWizardValues) => {
    if (!assessment?.application?.id && !assessment?.archetype?.id) {
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
      isDisabled={
        isSubmitting ||
        isValidating ||
        (currentStep === sortedSections.length &&
          !shouldNextBtnBeEnabled(sortedSections[currentStep - 1]))
      }
      hasAnswers={hasPartialAnswers(sortedSections[currentStep - 1])}
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

  useEffect(() => {
    const unlisten = history.listen((newLocation, action) => {
      if (action === "PUSH" && assessment) {
        handleCancelAssessment();
      }
    });
    return () => {
      unlisten();
    };
  }, [history, assessment]);

  const handleCancelAssessment = () => {
    if (assessment) {
      if (isArchetype) {
        assessment.status === "empty" &&
          deleteAssessmentMutation({
            assessmentId: assessment.id,
            applicationName: assessment.application?.name,
            applicationId: assessment.application?.id,
            archetypeId: assessment.archetype?.id,
          });
        if (assessmentToCancel) {
          history.push(
            formatPath(Paths.archetypeAssessmentActions, {
              archetypeId: assessment?.archetype?.id,
            })
          );
        }
      } else {
        assessment.status === "empty" &&
          deleteAssessmentMutation({
            assessmentId: assessment.id,
            applicationName: assessment.application?.name,
            applicationId: assessment.application?.id,
            archetypeId: assessment.archetype?.id,
          });
        if (assessmentToCancel) {
          history.push(
            formatPath(Paths.applicationAssessmentActions, {
              applicationId: assessment?.application?.id,
            })
          );
        }
      }
      setAssessmentToCancel(null);
    }
  };

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
              assessment && setAssessmentToCancel(assessment);
            }}
            onGoToStep={(step) => setCurrentStep(step.id as number)}
          />
          {assessmentToCancel && (
            <ConfirmDialog
              title={t("dialog.title.leavePage")}
              isOpen
              message={t("dialog.message.leavePage")}
              confirmBtnVariant={ButtonVariant.primary}
              confirmBtnLabel={t("actions.continue")}
              cancelBtnLabel={t("actions.cancel")}
              onCancel={() => setAssessmentToCancel(null)}
              onClose={() => setAssessmentToCancel(null)}
              onConfirm={() => handleCancelAssessment()}
            />
          )}
        </FormProvider>
      )}
    </>
  );
};
