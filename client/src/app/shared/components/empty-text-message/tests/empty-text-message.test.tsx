import React from "react";
import { shallow } from "enzyme";
import { EmptyTextMessage } from "../empty-text-message";

describe("EmptyTextMessage", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<EmptyTextMessage message="my custom message" />);
    expect(wrapper).toMatchSnapshot();
  });
});
