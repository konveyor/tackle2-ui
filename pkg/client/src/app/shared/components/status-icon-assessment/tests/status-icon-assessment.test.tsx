import React from "react";
import { shallow } from "enzyme";
import { StatusIconAssessment } from "../status-icon-assessment";

describe("StatusIconAssessment", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<StatusIconAssessment status="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
