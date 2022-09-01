import React from "react";
import { shallow } from "enzyme";
import { HorizontalNav } from "../horizontal-nav";

describe("HorizontalNav", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <HorizontalNav
        navItems={[
          {
            title: "first",
            path: "/first",
          },
          {
            title: "second",
            path: "/second",
          },
          {
            title: "thrid",
            path: "/thrid",
          },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
