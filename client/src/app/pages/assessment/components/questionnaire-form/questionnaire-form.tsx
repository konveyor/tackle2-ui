import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
} from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { SectionWithQuestionOrder } from "@app/api/models";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import { AssessmentWizardValues } from "@app/pages/assessment/components/assessment-wizard/assessment-wizard";
import { useWithUiId } from "@app/utils/query-utils";

import { getCommentFieldName } from "../../form-utils";

import { MultiInputSelection } from "./multi-input-selection";
import { Question, QuestionBody, QuestionHeader } from "./question";

export interface QuestionnaireFormProps {
  section: SectionWithQuestionOrder;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  section,
}) => {
  const { t } = useTranslation();
  const { control } = useFormContext<AssessmentWizardValues>();

  // Force the wizard parent to reset the scroll
  useEffect(() => {
    const parentWizardBody = document.getElementsByClassName(
      "pf-v5-c-wizard__main-body"
    );
    if (parentWizardBody && parentWizardBody[0]) {
      parentWizardBody[0].scrollIntoView();
    }
  }, []);

  const sortedQuestions = useMemo(() => {
    return section.questions.sort((a, b) => a.order - b.order);
  }, [section]);

  const questionsWithUiId = useWithUiId(
    sortedQuestions,
    (question) => `${section.name}-${question.order || "no-order"}`
  );

  // Comments

  const commentFieldName = getCommentFieldName(section, true);

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h1">{section.name}</Text>
        </TextContent>
      </StackItem>
      {questionsWithUiId.map((question) => {
        return (
          <StackItem key={question._ui_unique_id}>
            <Question cy-data="question">
              <QuestionHeader>
                <Split hasGutter>
                  <SplitItem>{question.text}</SplitItem>
                  <SplitItem>
                    <Popover bodyContent={<div>{question.explanation}</div>}>
                      <button
                        type="button"
                        aria-label="More info"
                        onClick={(e) => e.preventDefault()}
                        className="pf-v5-c-form__group-label-help"
                      >
                        <HelpIcon />
                      </button>
                    </Popover>
                  </SplitItem>
                </Split>
              </QuestionHeader>
              <QuestionBody>
                <MultiInputSelection
                  key={question._ui_unique_id}
                  question={question}
                />
              </QuestionBody>
            </Question>
          </StackItem>
        );
      })}
      <StackItem>
        <Question>
          <QuestionHeader>
            {t("terms.additionalNotesOrComments")}
          </QuestionHeader>
          <QuestionBody>
            <HookFormPFTextInput
              rows={4}
              control={control}
              name={commentFieldName as `comments.${string}`}
              fieldId="comments"
              type="text"
              aria-label="comments"
              aria-describedby="comments"
            ></HookFormPFTextInput>
          </QuestionBody>
        </Question>
      </StackItem>
    </Stack>
  );
};
