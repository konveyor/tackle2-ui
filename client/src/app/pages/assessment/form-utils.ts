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
  const fieldName = `category-${section.name}`;
  return fullName ? `${COMMENTS_KEY}.${fieldName}` : fieldName;
};

export const getQuestionFieldName = (question: Question, fullName: boolean) => {
  const fieldName = `question-${question.order}-${question.text}`;
  return fullName ? `${QUESTIONS_KEY}.${fieldName}` : fieldName;
};
