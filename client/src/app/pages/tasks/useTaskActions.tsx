import React from "react";

import {
  useCancelTaskMutation,
  useUpdateTaskMutation,
} from "@app/queries/tasks";
import { Task } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useTranslation } from "react-i18next";

export const useTaskActions = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { mutate: cancelTask } = useCancelTaskMutation(
    () =>
      pushNotification({
        title: t("titles.task"),
        message: t("message.cancelationRequestSubmitted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.task"),
        message: t("message.cancelationFailed"),
        variant: "danger",
      })
  );

  const { mutate: updateTask } = useUpdateTaskMutation(
    () =>
      pushNotification({
        title: t("titles.task"),
        message: t("message.updateRequestSubmitted"),
        variant: "info",
      }),
    () =>
      pushNotification({
        title: t("titles.task"),
        message: t("message.updateFailed"),
        variant: "danger",
      })
  );

  const togglePreemption = (task: Task) =>
    updateTask({
      id: task.id,
      policy: {
        preemptEnabled: !task.policy?.preemptEnabled,
      },
    });

  return { cancelTask, togglePreemption };
};
