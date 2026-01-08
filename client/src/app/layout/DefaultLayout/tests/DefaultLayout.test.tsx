import { BrowserRouter as Router } from "react-router-dom";

import { render } from "@app/test-config/test-utils";

import { NotificationsProvider } from "../../../components/NotificationsContext";
import { DefaultLayout } from "../DefaultLayout";

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
