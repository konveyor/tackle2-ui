import { render } from "@app/test-config/test-utils";
import React from "react";
import { StateNoData } from "../state-no-data";

describe("StateNoData", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<StateNoData />);
    expect(wrapper).toMatchSnapshot();
  });
});
