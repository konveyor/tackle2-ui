import { Question, Section } from "@app/api/models";

export const COMMENTS_KEY = "comments";
export const QUESTIONS_KEY = "questions";
export const SAVE_ACTION_KEY = "saveAction";

export enum SAVE_ACTION_VALUE {
  SAVE,
  SAVE_AND_REVIEW,
  SAVE_AS_DRAFT,
}
export const getCommentFieldName = (section: Section, fullName: boolean) => {
  const fieldName = `section-${section.name}`;
  const sanitizedFieldName = sanitizeKey(fieldName);
  return fullName
    ? `${COMMENTS_KEY}.${sanitizedFieldName}`
    : sanitizedFieldName;
};

export const sanitizeKey = (text: string) => {
  return text.replace(/[^a-zA-Z0-9-_:.]/g, "_");
};

export const getQuestionFieldName = (question: Question, fullName: boolean) => {
  const fieldName = `question-${question.order}-${question.text}`;
  return fullName
    ? `${QUESTIONS_KEY}.${sanitizeKey(fieldName)}`
    : sanitizeKey(fieldName);
};
