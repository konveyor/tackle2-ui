import React from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";
import { NotificationsContext } from "../notifications-context";

export const Notifications: React.FunctionComponent = () => {
  const appContext = React.useContext(NotificationsContext);
  return (
    <AlertGroup isToast aria-live="polite">
      {appContext.notifications.map((notification) => {
        const key = notification.key
          ? notification.key
          : `${notification.title}`;
        return (
          <Alert
            title={notification.title}
            variant={notification.variant}
            key={key}
            {...(!notification.hideCloseButton && {
              actionClose: (
                <AlertActionCloseButton
                  onClose={() => {
                    appContext.dismissNotification(key);
                  }}
                />
              ),
            })}
            timeout={notification.timeout ? notification.timeout : 4000}
          >
            {notification.message}
          </Alert>
        );
      })}
    </AlertGroup>
  );
};
