import React from "react";
import { shallow } from "enzyme";
import { Question } from "../question";

describe("Question", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<Question>content</Question>);
    expect(wrapper).toMatchSnapshot();
  });
});
