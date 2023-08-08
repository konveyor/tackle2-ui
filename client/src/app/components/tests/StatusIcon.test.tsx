import { render } from "@app/test-config/test-utils";
import React from "react";
import { IconedStatus } from "../IconedStatus";

describe("StatusIcon", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<IconedStatus preset="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
