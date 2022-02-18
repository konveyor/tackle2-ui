import React from "react";
import { shallow } from "enzyme";

import { StateError } from "../state-error";

describe("StateError", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<StateError />);
    expect(wrapper).toMatchSnapshot();
  });
});
