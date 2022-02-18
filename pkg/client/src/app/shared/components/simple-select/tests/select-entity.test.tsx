import React from "react";
import { shallow } from "enzyme";

import { SimpleSelect } from "../simple-select";

describe("SimpleSelect", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <SimpleSelect
        aria-label="my-selection"
        onChange={jest.fn()}
        options={["uno", "dos"]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
