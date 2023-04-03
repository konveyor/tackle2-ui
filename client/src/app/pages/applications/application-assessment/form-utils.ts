import { QuestionnaireCategory, Question } from "@app/api/models";

export const COMMENTS_KEY = "comments";
export const QUESTIONS_KEY = "questions";
export const SAVE_ACTION_KEY = "saveAction";

export enum SAVE_ACTION_VALUE {
  SAVE,
  SAVE_AND_REVIEW,
  SAVE_AS_DRAFT,
}
export const getCommentFieldName = (
  category: QuestionnaireCategory,
  fullName: boolean
) => {
  const fieldName = `category-${category.id}`;
  return fullName ? `${COMMENTS_KEY}.${fieldName}` : fieldName;
};

export const getQuestionFieldName = (question: Question, fullName: boolean) => {
  const fieldName = `question-${question.id}`;
  return fullName ? `${QUESTIONS_KEY}.${fieldName}` : fieldName;
};
