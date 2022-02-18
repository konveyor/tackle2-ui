import React from "react";
import { shallow } from "enzyme";
import { AppPlaceholder } from "../app-placeholder";

describe("AppPlaceholder", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<AppPlaceholder />);
    expect(wrapper).toMatchSnapshot();
  });
});
