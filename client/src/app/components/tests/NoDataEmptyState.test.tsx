import React from "react";

import { render } from "@app/test-config/test-utils";

import { NoDataEmptyState } from "../NoDataEmptyState";

describe("NoDataEmptyState", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <NoDataEmptyState title="my title" description="my description" />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
