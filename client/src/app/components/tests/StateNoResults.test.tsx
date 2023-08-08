import { render } from "@app/test-config/test-utils";
import React from "react";
import { StateNoResults } from "../StateNoResults";

describe("StateNoResults", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StateNoResults />);
    expect(wrapper).toMatchSnapshot();
  });
});
