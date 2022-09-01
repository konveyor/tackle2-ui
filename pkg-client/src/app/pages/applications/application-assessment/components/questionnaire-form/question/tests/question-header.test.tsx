import React from "react";
import { shallow } from "enzyme";
import { QuestionHeader } from "../question-header";

describe("QuestionHeader", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<QuestionHeader>content</QuestionHeader>);
    expect(wrapper).toMatchSnapshot();
  });
});
