import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

import { Paths } from "@app/Paths";
import { Task, TaskState } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCancelTaskMutation } from "@app/queries/tasks";
import { formatPath } from "@app/utils/utils";

const canCancel = (state: TaskState = "No task") =>
  !["Succeeded", "Failed", "Canceled"].includes(state);

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

  return { cancelTask };
};

export const useTaskActions = (task: Task<unknown>) => {
  const { cancelTask } = useAsyncTaskActions();
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
      title: t("actions.taskDetails"),
      onClick: () => {
        const currentPath = window.location.pathname;
        if (currentPath.includes("application")) {
          history.push(
            formatPath(Paths.applicationsTaskDetails, {
              applicationId: task.application?.id,
              taskId: task?.id,
            })
          );
        } else {
          history.push(
            formatPath(Paths.taskDetails, {
              taskId: task?.id,
            })
          );
        }
      },
    },
  ];
};
