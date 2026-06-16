import { useTranslation } from "react-i18next";

import { useNotifications } from "@app/components/NotificationsContext";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} from "@app/queries/users";

export const useUserActionsWithNotifications = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();

  const { mutate: deleteUser } = useDeleteUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userDeleted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userDeletionFailed"),
        variant: "danger",
      })
  );
  const { mutate: editUser } = useUpdateUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userUpdated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userUpdateFailed"),
        variant: "danger",
      })
  );
  const { mutate: createUser } = useCreateUserMutation(
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userCreated"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.user"),
        message: t("message.userCreationFailed"),
        variant: "danger",
      })
  );
  return { deleteUser, editUser, createUser };
};
