import React from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
} from "@patternfly/react-core";
import { NotificationsContext } from "../notifications-context";

export type notificationType =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "default";

export interface INotification {
  title: string;
  variant: notificationType;
  key?: string;
  message?: string | JSX.Element;
  actionClose?: boolean;
  timeout?: number | boolean;
}

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
            {...(notification.actionClose && {
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
