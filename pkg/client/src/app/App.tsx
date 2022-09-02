import React from "react";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./Routes";

import "@patternfly/patternfly/patternfly.css";
import "@patternfly/patternfly/patternfly-addons.css";

import { DefaultLayout } from "./layout";

import NotificationsPortal from "@redhat-cloud-services/frontend-components-notifications/NotificationPortal";
import "@redhat-cloud-services/frontend-components-notifications/index.css";

import { ConfirmDialogContainer } from "./shared/containers/confirm-dialog-container";
import { BulkCopyNotificationsContainer } from "./shared/containers/bulk-copy-notifications-container";
import { useFetchCookie } from "./queries/cookies";
import keycloak from "./keycloak";
import "./app.css";

const App: React.FC = () => {
  // Automatically updates cookie
  useFetchCookie(keycloak.token);

  return (
    <BrowserRouter>
      <DefaultLayout>
        <AppRoutes />
      </DefaultLayout>
      <NotificationsPortal />
      <ConfirmDialogContainer />
      <BulkCopyNotificationsContainer />
    </BrowserRouter>
  );
};

export default App;
