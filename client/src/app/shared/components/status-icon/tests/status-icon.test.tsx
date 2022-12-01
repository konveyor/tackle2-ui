import { render } from "@app/test-config/test-utils";
import React from "react";
import { StatusIcon } from "../status-icon";

describe("StatusIcon", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StatusIcon status="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
