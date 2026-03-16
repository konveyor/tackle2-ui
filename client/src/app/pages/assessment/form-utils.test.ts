import {
  QuestionWithSectionOrder,
  SectionWithQuestionOrder,
} from "@app/api/models";

import { getCommentFieldName, getQuestionFieldName } from "./form-utils";

describe("Application assessment - form utils", () => {
  const section: SectionWithQuestionOrder = {
    name: "section-123",
    order: 1,
    questions: [],
  };
  const question: QuestionWithSectionOrder = {
    text: "Question 321",
    order: 1,
    answers: [],
    explanation: "Explanation 321",
    sectionOrder: 1,
  };

  it("getCommentFieldName: fullName", () => {
    const fieldName = getCommentFieldName(section, true);
    expect(fieldName).toBe("comments.section-section-123");
  });

  it("getCommentFieldName: singleName", () => {
    const fieldName = getCommentFieldName(section, false);
    expect(fieldName).toBe("section-section-123");
  });

  it("getQuestionFieldName: fullName", () => {
    const fieldName = getQuestionFieldName(question, true);
    expect(fieldName).toBe("questions.section-1-question-1");
  });

  it("getQuestionFieldName: singleName", () => {
    const fieldName = getQuestionFieldName(question, false);
    expect(fieldName).toBe("section-1-question-1");
  });
});
