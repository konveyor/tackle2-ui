import React from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";
import { NotificationsContext } from "./NotificationsContext";

export const Notifications: React.FunctionComponent = () => {
  const appContext = React.useContext(NotificationsContext);
  return (
    <AlertGroup isToast aria-live="polite">
      {appContext.notifications.map((notification, index) => {
        return (
          <Alert
            title={notification.title}
            variant={notification.variant}
            key={`${notification.title}-${index}`}
            {...(!notification.hideCloseButton && {
              actionClose: (
                <AlertActionCloseButton
                  onClose={() => {
                    appContext.dismissNotification(notification.title);
                  }}
                />
              ),
            })}
          >
            {notification.message}
          </Alert>
        );
      })}
    </AlertGroup>
  );
};
