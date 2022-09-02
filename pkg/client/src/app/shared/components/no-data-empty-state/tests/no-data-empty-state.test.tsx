import React from "react";
import { shallow } from "enzyme";
import { NoDataEmptyState } from "../no-data-empty-state";

describe("NoDataEmptyState", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <NoDataEmptyState title="my title" description="my description" />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
