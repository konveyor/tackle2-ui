import { render } from "@app/test-config/test-utils";
import React from "react";
import { NoDataEmptyState } from "../no-data-empty-state";

describe("NoDataEmptyState", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <NoDataEmptyState title="my title" description="my description" />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
