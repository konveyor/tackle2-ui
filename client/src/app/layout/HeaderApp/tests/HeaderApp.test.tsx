import { render } from "@app/test-config/test-utils";
import React from "react";
import { HeaderApp } from "../HeaderApp";

it("Test snapshot", () => {
  const wrapper = render(<HeaderApp />);
  expect(wrapper).toMatchSnapshot();
});
