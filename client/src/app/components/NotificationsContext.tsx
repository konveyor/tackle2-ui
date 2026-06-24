import * as React from "react";
import { AlertProps } from "@patternfly/react-core";

export type INotification = {
  title: string;
  variant: AlertProps["variant"];
  message?: React.ReactNode;
  hideCloseButton?: boolean;
  timeout?: number | boolean;
};

interface INotificationsProvider {
  children: React.ReactNode;
}

interface INotificationsContext {
  pushNotification: (
    notification: INotification,
    clearNotificationDelay?: number
  ) => void;
  dismissNotification: (key: string) => void;
  notifications: INotification[];
}

const appContextDefaultValue = {} as INotificationsContext;

const notificationDefault: Pick<INotification, "hideCloseButton"> = {
  hideCloseButton: false,
};

export const NotificationsContext = React.createContext<INotificationsContext>(
  appContextDefaultValue
);

export const useNotifications = () => {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};

export const NotificationsProvider: React.FunctionComponent<
  INotificationsProvider
> = ({ children }: INotificationsProvider) => {
  const [notifications, setNotifications] = React.useState<INotification[]>([]);

  const pushNotification = React.useCallback(
    (notification: INotification, clearNotificationDelay: number = 8000) => {
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { ...notificationDefault, ...notification },
      ]);

      setTimeout(
        () => {
          setNotifications((prevNotifications) =>
            prevNotifications.filter(
              (notif) => notif.title !== notification.title
            )
          );
        },
        clearNotificationDelay < 0 ? 0 : clearNotificationDelay
      );
    },
    []
  );

  const dismissNotification = React.useCallback((title: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.title !== title)
    );
  }, []);

  const contextValue = React.useMemo(
    () => ({
      pushNotification,
      dismissNotification,
      notifications,
    }),
    [pushNotification, dismissNotification, notifications]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};
