import { render } from "@app/test-config/test-utils";
import React from "react";
import { AppPlaceholder } from "../AppPlaceholder";

describe("AppPlaceholder", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<AppPlaceholder />);
    expect(wrapper).toMatchSnapshot();
  });
});
