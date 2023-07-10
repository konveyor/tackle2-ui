import { render } from "@app/test-config/test-utils";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { SidebarApp } from "../SidebarApp";

it.skip("Renders without crashing", () => {
  const wrapper = render(
    <Router>
      <SidebarApp />
    </Router>
  );
  expect(wrapper).toMatchSnapshot();
});
