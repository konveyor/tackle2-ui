import { Question, QuestionnaireCategory } from "@app/api/models";
import { getCommentFieldName, getQuestionFieldName } from "./form-utils";

describe("Application assessment - form utils", () => {
  const category: QuestionnaireCategory = {
    id: 123,
    order: 1,
    questions: [],
  };
  const question: Question = {
    id: 321,
    order: 1,
    options: [],
    description: "",
    question: "",
  };

  it("getCommentFieldName: fullName", () => {
    const fieldName = getCommentFieldName(category, true);
    expect(fieldName).toBe("comments.category-123");
  });

  it("getCommentFieldName: singleName", () => {
    const fieldName = getCommentFieldName(category, false);
    expect(fieldName).toBe("category-123");
  });

  it("getQuestionFieldName: fullName", () => {
    const fieldName = getQuestionFieldName(question, true);
    expect(fieldName).toBe("questions.question-321");
  });

  it("getQuestionFieldName: singleName", () => {
    const fieldName = getQuestionFieldName(question, false);
    expect(fieldName).toBe("question-321");
  });
});
