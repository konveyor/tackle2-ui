import { render } from "@app/test-config/test-utils";
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { DefaultLayout } from "../DefaultLayout";
import { NotificationsProvider } from "../../../../app/shared/notifications-context";

it("Test snapshot", () => {
  const wrapper = render(
    <Router>
      <NotificationsProvider>
        <DefaultLayout />
      </NotificationsProvider>
    </Router>
  );
  expect(wrapper).toMatchSnapshot();
});
