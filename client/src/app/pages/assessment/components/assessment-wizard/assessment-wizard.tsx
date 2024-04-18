import * as yup from "yup";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { FieldErrors, FormProvider, useForm } from "react-hook-form";
import {
  ButtonVariant,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import {
  Assessment,
  AssessmentStatus,
  AssessmentWithSectionOrder,
  GroupedStakeholderRef,
  QuestionWithSectionOrder,
  Ref,
  SectionWithQuestionOrder,
} from "@app/api/models";
import { CustomWizardFooter } from "../custom-wizard-footer";
import { getApplicationById, getArchetypeById } from "@app/api/rest";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { QuestionnaireForm } from "../questionnaire-form";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import {
  COMMENTS_KEY,
  QUESTIONS_KEY,
  getCommentFieldName,
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
import {
  AssessmentStakeholdersForm,
  combineAndGroupStakeholderRefs,
} from "../assessment-stakeholders-form/assessment-stakeholders-form";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { WizardStepNavDescription } from "../wizard-step-nav-description";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

export const SAVE_ACTION_KEY = "saveAction";

export enum SAVE_ACTION_VALUE {
  SAVE,
  SAVE_AND_REVIEW,
  SAVE_AS_DRAFT,
}

export interface AssessmentWizardValues {
  stakeholdersAndGroupsRefs: GroupedStakeholderRef[];

  [COMMENTS_KEY]: {
    [key: string]: string; // <categoryId, commentValue>
  };
  [QUESTIONS_KEY]: {
    [key: string]: string | undefined; // <questionId, optionId>
  };
  [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE;
}

export interface AssessmentWizardProps {
  assessment?: AssessmentWithSectionOrder;
  onClose: () => void;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  assessment,
  onClose,
}) => {
  const isArchetype = useIsArchetype();
  const queryClient = useQueryClient();

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

  const sortedSections = (assessment ? assessment.sections : []).sort(
    (a, b) => a.order - b.order
  );

  const initialComments = useMemo(() => {
    const comments: { [key: string]: string } = {};
    if (assessment) {
      assessment.sections.forEach((section) => {
        comments[getCommentFieldName(section, false)] = section.comment || "";
      });
    }
    return comments;
  }, [assessment]);

  const initialStakeholders = assessment?.stakeholders ?? [];
  const initialStakeholderGroups = assessment?.stakeholderGroups ?? [];
  const initialQuestions = useMemo(() => {
    const questions: { [key: string]: string | undefined } = {};
    if (assessment) {
      assessment.sections
        .flatMap((f) => f.questions)
        .forEach((question) => {
          const existingAnswer = assessment?.sections
            ?.flatMap((section) => section.questions)
            .find((q) => q.text === question.text)
            ?.answers.find((a) => a.selected === true);

          questions[getQuestionFieldName(question, false)] =
            existingAnswer?.text || "";
        });
    }
    return questions;
  }, [assessment]);

  const validationSchema = yup.object().shape({
    stakeholdersAndGroupsRefs: yup.array().of(
      yup.object().shape({
        id: yup.number().required(),
        name: yup.string().required(),
        group: yup
          .string()
          .oneOf(["Stakeholder", "Stakeholder Group"])
          .required(),
      })
    ),
  });

  const methods = useForm<AssessmentWizardValues>({
    resolver: yupResolver(validationSchema),
    mode: "all",
    defaultValues: {
      // stakeholders: assessment?.stakeholders ?? [],
      // stakeholderGroups: assessment?.stakeholderGroups ?? [],
      stakeholdersAndGroupsRefs: assessment
        ? combineStakeholdersAndGroups(assessment)
        : [],

      [COMMENTS_KEY]: initialComments,
      [QUESTIONS_KEY]: initialQuestions,
      [SAVE_ACTION_KEY]: SAVE_ACTION_VALUE.SAVE_AS_DRAFT,
    },
  });
  const values = methods.getValues();

  const errors = methods.formState.errors;
  const isValid = methods.formState.isValid;
  const isSubmitting = methods.formState.isSubmitting;
  const isValidating = methods.formState.isValidating;

  const disableNavigation = !isValid || isSubmitting;

  const isFirstStepValid = () => {
    const numberOfStakeholdlersAndGroups =
      values?.stakeholdersAndGroupsRefs?.length || 0;
    return numberOfStakeholdlersAndGroups > 0;
  };

  const isQuestionValid = (question: QuestionWithSectionOrder): boolean => {
    const questionErrors = errors.questions || {};
    return !questionErrors[getQuestionFieldName(question, false)];
  };

  const questionHasValue = (question: QuestionWithSectionOrder): boolean => {
    const questionValues = values.questions || {};
    const value = questionValues[getQuestionFieldName(question, false)];
    return value !== null && value !== undefined && value !== "";
  };

  const areAllQuestionsAnswered = (
    section: SectionWithQuestionOrder
  ): boolean => {
    return (
      section?.questions.every((question) => {
        return questionHasValue(question);
      }) ?? false
    );
  };

  const shouldDisableSaveAsDraft = (
    sections: SectionWithQuestionOrder[]
  ): boolean => {
    const noAnswers = sections.every((section) => {
      return section.questions.every((question) => !questionHasValue(question));
    });

    const allQuestionsAnswered = sections.every((section) =>
      areAllQuestionsAnswered(section)
    );

    return noAnswers || allQuestionsAnswered;
  };

  const shouldNextBtnBeEnabled = (
    section: SectionWithQuestionOrder
  ): boolean => {
    const allQuestionsValid = section?.questions.every((question) =>
      isQuestionValid(question)
    );
    const allQuestionsAnswered = areAllQuestionsAnswered(section);
    return allQuestionsAnswered && allQuestionsValid;
  };

  const onInvalid = (errors: FieldErrors<AssessmentWizardValues>) =>
    console.error("form errors", errors);

  const buildSectionsFromFormValues = (
    formValues: AssessmentWizardValues
  ): SectionWithQuestionOrder[] => {
    if (!formValues || !formValues[QUESTIONS_KEY]) {
      return [];
    }
    const updatedQuestionsData = formValues[QUESTIONS_KEY];

    const sections: SectionWithQuestionOrder[] =
      assessment?.sections?.map((section) => {
        const commentValues = values["comments"];
        const fieldName = getCommentFieldName(section, false);
        const commentValue = commentValues[fieldName];
        return {
          ...section,
          comment: commentValue,
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
  const mapAndSeparateStakeholdersAndGroups = (
    combinedRefs: GroupedStakeholderRef[]
  ): { stakeholdersPayload: Ref[]; stakeholderGroupsPayload: Ref[] } => {
    const stakeholdersPayload = combinedRefs
      .filter((ref) => ref.group === "Stakeholder")
      .map(({ id, name }) => ({ id, name }));

    const stakeholderGroupsPayload = combinedRefs
      .filter((ref) => ref.group === "Stakeholder Group")
      .map(({ id, name }) => ({ id, name }));

    return { stakeholdersPayload, stakeholderGroupsPayload };
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
      const { stakeholdersPayload, stakeholderGroupsPayload } =
        mapAndSeparateStakeholdersAndGroups(
          formValues.stakeholdersAndGroupsRefs
        );

      const assessmentStatus: AssessmentStatus = "started";
      const payload: AssessmentWithSectionOrder = {
        ...assessment,

        stakeholders: stakeholdersPayload,
        stakeholderGroups: stakeholderGroupsPayload,

        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved as a draft.",
        variant: "info",
      });
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

      const { stakeholdersPayload, stakeholderGroupsPayload } =
        mapAndSeparateStakeholdersAndGroups(
          formValues.stakeholdersAndGroupsRefs
        );
      const payload: AssessmentWithSectionOrder = {
        ...assessment,

        stakeholders: stakeholdersPayload,
        stakeholderGroups: stakeholderGroupsPayload,

        sections,
        status: assessmentStatus,
      };

      await updateAssessmentMutation(payload);
      pushNotification({
        title: "Assessment has been saved.",
        variant: "success",
      });
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

      const { stakeholdersPayload, stakeholderGroupsPayload } =
        mapAndSeparateStakeholdersAndGroups(
          formValues.stakeholdersAndGroupsRefs
        );

      const payload: AssessmentWithSectionOrder = {
        ...assessment,

        stakeholders: stakeholdersPayload,
        stakeholderGroups: stakeholderGroupsPayload,
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
        methods.reset();
        onClose();

        break;
      case SAVE_ACTION_VALUE.SAVE_AS_DRAFT:
        await handleSaveAsDraft(formValues);
        methods.reset();
        onClose();
        break;
      case SAVE_ACTION_VALUE.SAVE_AND_REVIEW:
        handleSaveAndReview(formValues);
        methods.reset();
        onClose();
        break;
      default:
        methods.reset();
        onClose();
        break;
    }
  };

  const isAssessmentChanged = () => {
    // Checking if any questions have changed
    const questionsChanged = Object.entries(values[QUESTIONS_KEY]).some(
      ([name, answer]) => initialQuestions[name] !== answer
    );

    // Checking if any stakeholders or stakeholder groups have changed
    const stakeholdersAndGroupsChanged = (
      initialRefs: GroupedStakeholderRef[],
      currentRefs: GroupedStakeholderRef[]
    ) => {
      if (initialRefs.length !== currentRefs.length) return true;
      const refMap = new Map(
        initialRefs.map((ref) => [`${ref.id}-${ref.group}`, ref.name])
      );
      return currentRefs.some(
        (ref) => refMap.get(`${ref.id}-${ref.group}`) !== ref.name
      );
    };

    // Extract initial combined stakeholders and groups from the assessment
    const initialCombinedRefs = assessment
      ? combineStakeholdersAndGroups(assessment)
      : [];

    // Current combined stakeholders and groups from form values
    const currentCombinedRefs = values.stakeholdersAndGroupsRefs;

    // Determine if there's been any change
    return (
      questionsChanged ||
      stakeholdersAndGroupsChanged(initialCombinedRefs, currentCombinedRefs)
    );
  };

  const handleCancelAssessment = () => {
    if (assessment) {
      if (isArchetype) {
        assessment.status === "empty" &&
          deleteAssessmentMutation({
            assessmentId: assessment.id,
            applicationName: assessment.application?.name,
            applicationId: assessment.application?.id,
            archetypeName: assessment.archetype?.name,
            archetypeId: assessment.archetype?.id,
          });
      } else {
        assessment.status === "empty" &&
          deleteAssessmentMutation({
            assessmentId: assessment.id,
            applicationName: assessment.application?.name,
            applicationId: assessment.application?.id,
            archetypeName: assessment.archetype?.name,
            archetypeId: assessment.archetype?.id,
          });
      }
    }
    setAssessmentToCancel(null);
    methods.reset();
    onClose();
  };

  const getWizardFooter = (
    step: number,
    section?: SectionWithQuestionOrder
  ) => {
    return (
      <CustomWizardFooter
        enableNext={
          section ? shouldNextBtnBeEnabled(section) : isFirstStepValid()
        }
        isFirstStep={step === 0}
        isLastStep={step === sortedSections.length}
        onNext={() => setCurrentStep(step + 1)}
        onBack={() => setCurrentStep(step - 1)}
        isAssessmentChanged={isAssessmentChanged()}
        isDisabled={
          isSubmitting ||
          isValidating ||
          (step === sortedSections.length &&
            !shouldNextBtnBeEnabled(sortedSections[step - 1]))
        }
        isSaveAsDraftDisabled={shouldDisableSaveAsDraft(sortedSections)}
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
  };

  return (
    <>
      {!assessment?.id ? (
        <AppPlaceholder />
      ) : (
        <FormProvider {...methods}>
          <Wizard
            key={sortedSections.length}
            isVisitRequired
            onStepChange={(_e, curr) => {
              setCurrentStep(curr.index);
            }}
            onClose={() => {
              assessment && setAssessmentToCancel(assessment);
            }}
            header={
              <WizardHeader
                title={t("terms.assessment")}
                onClose={() => {
                  assessment && setAssessmentToCancel(assessment);
                }}
              />
            }
          >
            <WizardStep
              id={0}
              footer={getWizardFooter(0)}
              name={t("composed.selectMany", {
                what: t("terms.stakeholders").toLowerCase(),
              })}
              isDisabled={currentStep !== 0 && disableNavigation}
            >
              <AssessmentStakeholdersForm />
            </WizardStep>
            {...sortedSections.map((section, index) => {
              const stepIndex = index + 1;
              return (
                <WizardStep
                  key={`${index}-${section.name}`}
                  id={stepIndex}
                  name={section.name}
                  isDisabled={stepIndex !== currentStep && disableNavigation}
                  navItem={{
                    children: <WizardStepNavDescription section={section} />,
                  }}
                  footer={getWizardFooter(stepIndex, section)}
                >
                  <QuestionnaireForm key={section.name} section={section} />
                </WizardStep>
              );
            })}
          </Wizard>
          {assessmentToCancel && (
            <ConfirmDialog
              title={t("dialog.title.leaveAssessment")}
              isOpen
              confirmBtnVariant={ButtonVariant.primary}
              confirmBtnLabel={t("actions.continue")}
              cancelBtnLabel={t("actions.cancel")}
              onCancel={() => setAssessmentToCancel(null)}
              onClose={() => setAssessmentToCancel(null)}
              onConfirm={() => handleCancelAssessment()}
              message={
                isAssessmentChanged()
                  ? t("message.unsavedChanges")
                  : t("message.noAnswers")
              }
            />
          )}
        </FormProvider>
      )}
    </>
  );
};

const combineStakeholdersAndGroups = (
  assessment: AssessmentWithSectionOrder
): GroupedStakeholderRef[] => {
  const stakeholders = assessment.stakeholders ?? [];
  const stakeholderGroups = assessment.stakeholderGroups ?? [];

  return combineAndGroupStakeholderRefs(stakeholders, stakeholderGroups);
};
