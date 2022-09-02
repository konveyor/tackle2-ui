import React from "react";
import { shallow } from "enzyme";
import { StatusIcon } from "../status-icon";

describe("StatusIcon", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<StatusIcon status="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
