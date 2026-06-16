import { useTranslation } from "react-i18next";

import { useNotifications } from "@app/components/NotificationsContext";
import { useDeleteTokenMutation } from "@app/queries/tokens";

export const useTokenActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: revokeToken } = useDeleteTokenMutation(
    () =>
      pushNotification({
        title: t("titles.token"),
        message: t("message.tokenRevoked"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.token"),
        message: t("message.tokenRevocationFailed"),
        variant: "danger",
      })
  );

  return { revokeToken };
};
