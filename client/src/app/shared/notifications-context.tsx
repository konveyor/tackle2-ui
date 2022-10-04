import * as React from "react";

export type notificationType =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "default";

export type INotification = {
  title: string;
  variant: notificationType;
  key?: string;
  message?: React.ReactNode;
  hideCloseButton?: boolean;
  actionClose?: React.ReactNode;
  timeout?: number | boolean;
};

interface INotificationsProvider {
  children: React.ReactNode;
}

interface INotificationsContext {
  pushNotification: (notification: INotification) => void;
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

export const NotificationsProvider: React.FunctionComponent<
  INotificationsProvider
> = ({ children }: INotificationsProvider) => {
  const [notifications, setNotifications] = React.useState<INotification[]>([]);

  const pushNotification = (notification: INotification) => {
    setNotifications([
      ...notifications,
      { ...notificationDefault, ...notification },
    ]);
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
