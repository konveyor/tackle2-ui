import { render } from "@app/test-config/test-utils";
import React from "react";
import { StateError } from "../state-error";

describe("StateError", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StateError />);
    expect(wrapper).toMatchSnapshot();
  });
});
