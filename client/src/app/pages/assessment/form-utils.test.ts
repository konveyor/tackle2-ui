import { Question, Section } from "@app/api/models";
import { getCommentFieldName, getQuestionFieldName } from "./form-utils";

describe("Application assessment - form utils", () => {
  const section: Section = {
    name: "category-123",
    order: 1,
    questions: [],
  };
  const question: Question = {
    text: "Question 321",
    order: 1,
    answers: [],
    explanation: "Explanation 321",
  };

  it("getCommentFieldName: fullName", () => {
    const fieldName = getCommentFieldName(section, true);
    expect(fieldName).toBe("comments.category-category-123");
  });

  it("getCommentFieldName: singleName", () => {
    const fieldName = getCommentFieldName(section, false);
    expect(fieldName).toBe("category-category-123");
  });

  it("getQuestionFieldName: fullName", () => {
    const fieldName = getQuestionFieldName(question, true);
    expect(fieldName).toBe("questions.question-1-Question_321");
  });

  it("getQuestionFieldName: singleName", () => {
    const fieldName = getQuestionFieldName(question, false);
    expect(fieldName).toBe("question-1-Question_321");
  });
});
