import React, { useEffect, useMemo } from "react";
import { Field } from "formik";
import { useTranslation } from "react-i18next";

import {
  Popover,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { QuestionnaireCategory } from "@app/api/models";
import { getValidatedFromError } from "@app/utils/utils";

import { MultiInputSelection } from "./multi-input-selection";
import { Question, QuestionHeader, QuestionBody } from "./question";

import { getCommentFieldName } from "../../form-utils";

export interface QuestionnaireFormProps {
  category: QuestionnaireCategory;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  category,
}) => {
  const { t } = useTranslation();

  // Force the wizard parent to reset the scroll
  useEffect(() => {
    const parentWizardBody = document.getElementsByClassName(
      "pf-c-wizard__main-body"
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

  const validateComment = (val: string) => {
    const maxLength = 1_000;

    let error;
    if (val && val.length > maxLength) {
      error = t("validation.maxLength", { length: maxLength });
    }
    return error;
  };

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
                      className="pf-c-form__group-label-help"
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
            <Field name={commentFieldName} validate={validateComment}>
              {({ field, form, meta }: any) => (
                <TextArea
                  rows={4}
                  type="text"
                  name={commentFieldName}
                  aria-label="comments"
                  aria-describedby="comments"
                  isRequired={false}
                  onChange={(_, event) => field.onChange(event)}
                  onBlur={(event) => field.onBlur(event)}
                  value={field.value}
                  validated={getValidatedFromError(meta.error)}
                />
              )}
            </Field>
          </QuestionBody>
        </Question>
      </StackItem>
    </Stack>
  );
};
