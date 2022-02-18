import React from "react";
import { shallow } from "enzyme";

import { StateNoResults } from "../state-no-results";

describe("StateNoResults", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<StateNoResults />);
    expect(wrapper).toMatchSnapshot();
  });
});
