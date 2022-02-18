import React from "react";
import { shallow } from "enzyme";
import { QuestionBody } from "../question-body";

describe("QuestionBody", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<QuestionBody>content</QuestionBody>);
    expect(wrapper).toMatchSnapshot();
  });
});
