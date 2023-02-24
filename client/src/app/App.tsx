import React from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./Routes";
import { DefaultLayout } from "./layout";
import { NotificationsProvider } from "./shared/notifications-context";
import { PageDrawerContextProvider } from "./shared/page-drawer-context";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";

import "./app.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <PageDrawerContextProvider>
          <DefaultLayout>
            <AppRoutes />
          </DefaultLayout>
        </PageDrawerContextProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
};

export default App;
