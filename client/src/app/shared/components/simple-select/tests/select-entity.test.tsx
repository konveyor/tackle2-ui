import React from "react";
import { SimpleSelect } from "../simple-select";
import { render } from "@app/test-config/test-utils";

describe("SimpleSelect", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <SimpleSelect
        aria-label="my-selection"
        onChange={jest.fn()}
        options={["uno", "dos"]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
