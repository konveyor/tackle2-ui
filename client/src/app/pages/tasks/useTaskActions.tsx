import React from "react";

import {
  useCancelTaskMutation,
  useUpdateTaskMutation,
} from "@app/queries/tasks";
import { Task, TaskState } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { formatPath } from "@app/utils/utils";
import { Paths } from "@app/Paths";

const canCancel = (state: TaskState = "No task") =>
  !["Succeeded", "Failed", "Canceled"].includes(state);

const canTogglePreemption = (state: TaskState = "No task") =>
  !["Succeeded", "Failed", "Canceled", "Running"].includes(state);

const useAsyncTaskActions = () => {
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

export const useTaskActions = (task: Task) => {
  const { cancelTask, togglePreemption } = useAsyncTaskActions();
  const { t } = useTranslation();
  const history = useHistory();

  return [
    {
      title: t("actions.cancel"),
      isAriaDisabled: !canCancel(task.state),
      tooltipProps: {
        content: !canCancel(task.state)
          ? t("message.cancelNotAvailable", { statusName: task.state })
          : "",
      },
      onClick: () => cancelTask(task.id),
    },
    {
      title: task.policy?.preemptEnabled
        ? t("actions.disablePreemption")
        : t("actions.enablePreemption"),
      isAriaDisabled: !canTogglePreemption(task.state),
      onClick: () => togglePreemption(task),
      tooltipProps: {
        content: !canTogglePreemption(task.state)
          ? t("message.togglePreemptionNotAvailable", {
              statusName: task.state,
            })
          : "",
      },
    },
    {
      title: t("actions.taskDetails"),
      onClick: () =>
        history.push(
          formatPath(Paths.taskDetails, {
            taskId: task.id,
          })
        ),
    },
  ];
};
