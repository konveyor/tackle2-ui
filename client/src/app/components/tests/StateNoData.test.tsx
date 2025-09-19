import React from "react";

import { render } from "@app/test-config/test-utils";

import { StateNoData } from "../StateNoData";

describe("StateNoData", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StateNoData />);
    expect(wrapper).toMatchSnapshot();
  });
});
