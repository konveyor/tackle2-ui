import React from "react";
import { shallow } from "enzyme";

import { StateNoData } from "../state-no-data";

describe("StateNoData", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<StateNoData />);
    expect(wrapper).toMatchSnapshot();
  });
});
