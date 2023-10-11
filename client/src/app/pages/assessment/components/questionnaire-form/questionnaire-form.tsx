import React, { useEffect, useMemo } from "react";
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
import { MultiInputSelection } from "./multi-input-selection";
import { Question, QuestionHeader, QuestionBody } from "./question";
import { getCommentFieldName } from "../../form-utils";
import { useFormContext } from "react-hook-form";
import { Section } from "@app/api/models";
import { AssessmentWizardValues } from "@app/pages/assessment/components/assessment-wizard/assessment-wizard";

export interface QuestionnaireFormProps {
  section: Section;
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

  // Comments

  const commentFieldName = getCommentFieldName(section, true);

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h1">{section.name}</Text>
        </TextContent>
      </StackItem>
      {sortedQuestions.map((question, i) => {
        const questionUniqueKey = `${section.name}-${
          question.order || "no-order"
        }-${question.text || "no-text"}-${i}`;
        return (
          <StackItem key={questionUniqueKey}>
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
                  key={questionUniqueKey}
                  question={question}
                />
              </QuestionBody>
            </Question>
          </StackItem>
        );
      })}
      {/* <StackItem>
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
      </StackItem> */}
    </Stack>
  );
};
