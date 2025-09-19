import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { render } from "@app/test-config/test-utils";

import { HorizontalNav } from "../HorizontalNav";

describe("HorizontalNav", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <Router>
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
      </Router>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
