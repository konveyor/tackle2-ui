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
import { QuestionnaireCategory } from "@app/api/models";
import { MultiInputSelection } from "./multi-input-selection";
import { Question, QuestionHeader, QuestionBody } from "./question";
import { getCommentFieldName } from "../../form-utils";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import { useFormContext } from "react-hook-form";
import { ApplicationAssessmentWizardValues } from "../application-assessment-wizard/application-assessment-wizard";

export interface QuestionnaireFormProps {
  category: QuestionnaireCategory;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  category,
}) => {
  const { t } = useTranslation();
  const { control, getValues } =
    useFormContext<ApplicationAssessmentWizardValues>();

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
    return category.questions.sort((a, b) => a.order - b.order);
  }, [category]);

  // Comments

  const commentFieldName = getCommentFieldName(category, true);

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h1">{category.title}</Text>
        </TextContent>
      </StackItem>
      {sortedQuestions.map((question) => (
        <StackItem key={question.id}>
          <Question cy-data="question">
            <QuestionHeader>
              <Split hasGutter>
                <SplitItem>{question.question}</SplitItem>
                <SplitItem>
                  <Popover bodyContent={<div>{question.description}</div>}>
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
              <MultiInputSelection question={question} />
            </QuestionBody>
          </Question>
        </StackItem>
      ))}
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
