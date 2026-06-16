import { useTranslation } from "react-i18next";

import { useNotifications } from "@app/components/NotificationsContext";
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useUpdateRoleMutation,
} from "@app/queries/roles";

export const useRoleActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deleteRole } = useDeleteRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleDeletionFailed"),
        variant: "danger",
      })
  );

  const { mutate: editRole } = useUpdateRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleUpdated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleUpdateFailed"),
        variant: "danger",
      })
  );

  const { mutate: createRole } = useCreateRoleMutation(
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleCreated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.role"),
        message: t("message.roleCreationFailed"),
        variant: "danger",
      })
  );

  return { deleteRole, editRole, createRole };
};
