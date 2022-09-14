import React from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./Routes";
import { DefaultLayout } from "./layout";
import { NotificationsProvider } from "./shared/notifications-context";
import { ConfirmDialogContainer } from "./shared/containers/confirm-dialog-container";
import { BulkCopyNotificationsContainer } from "./shared/containers/bulk-copy-notifications-container";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";

import "./app.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <DefaultLayout>
          <AppRoutes />
        </DefaultLayout>
      </NotificationsProvider>
      <ConfirmDialogContainer />
      <BulkCopyNotificationsContainer />
    </BrowserRouter>
  );
};

export default App;
