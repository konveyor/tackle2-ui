import { render } from "@app/test-config/test-utils";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { DefaultLayout } from "../DefaultLayout";
import { NotificationsProvider } from "../../../components/NotificationsContext";

it.skip("Test snapshot", () => {
  const wrapper = render(
    <Router>
      <NotificationsProvider>
        <DefaultLayout />
      </NotificationsProvider>
    </Router>
  );
  expect(wrapper).toMatchSnapshot();
});
