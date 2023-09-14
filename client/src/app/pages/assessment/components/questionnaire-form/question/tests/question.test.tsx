import { render } from "@app/test-config/test-utils";
import React from "react";
import { Question } from "../question";

describe("Question", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<Question>content</Question>);
    expect(wrapper).toMatchSnapshot();
  });
});
