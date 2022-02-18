import React from "react";
import { shallow } from "enzyme";
import { SimplePagination } from "../simple-pagination";

describe("SimplePagination", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <SimplePagination
        count={15}
        params={{ page: 1, perPage: 10 }}
        onChange={jest.fn}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
