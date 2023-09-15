import { render } from "@app/test-config/test-utils";
import React from "react";
import { QuestionHeader } from "../question-header";

describe("QuestionHeader", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<QuestionHeader>content</QuestionHeader>);
    expect(wrapper).toMatchSnapshot();
  });
});
