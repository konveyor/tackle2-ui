import React from "react";

import { render } from "@app/test-config/test-utils";

import { IconedStatus } from "../Icons";

describe("StatusIcon", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<IconedStatus preset="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
