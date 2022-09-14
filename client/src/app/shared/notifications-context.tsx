import * as React from "react";
import { INotification } from "@app/shared/components/Notifications";

interface INotificationsProvider {
  children: React.ReactNode;
}

interface INotificationsContext {
  pushNotification: (notification: INotification) => void;
  dismissNotification: (key: string) => void;
  notifications: INotification[];
}

const appContextDefaultValue = {} as INotificationsContext;

export const NotificationsContext = React.createContext<INotificationsContext>(
  appContextDefaultValue
);

export const NotificationsProvider: React.FunctionComponent<
  INotificationsProvider
> = ({ children }: INotificationsProvider) => {
  const [notifications, setNotifications] = React.useState<INotification[]>([]);

  const pushNotification = (notification: INotification) => {
    setNotifications([...notifications, notification]);
  };

  const dismissNotification = (key: string) => {
    const remainingNotifications = notifications.filter((n) => n.key !== key);
    setNotifications(remainingNotifications);
  };

  return (
    <NotificationsContext.Provider
      value={{
        pushNotification,
        dismissNotification,
        notifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
