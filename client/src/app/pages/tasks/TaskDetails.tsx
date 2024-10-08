import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Paths, TaskDetailsAttachmentRoute, TaskFromApp } from "@app/Paths";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { formatPath } from "@app/utils/utils";
import { TaskDetailsBase } from "./TaskDetailsBase";
import { getTaskById } from "@app/api/rest";
import { useState, useEffect } from "react";

export const TaskDetails = () => {
  const { t } = useTranslation();
  const { taskId, attachmentId } = useParams<TaskDetailsAttachmentRoute>();
  const { isFApplication } = useParams<TaskFromApp>();
  const result = isFApplication === "true" ? true : false;
  const [applicationName, setApplicationName] = useState<string | undefined>();
  const [applicationId, setApplicationId] = useState<number | undefined>();

  useEffect(() => {
    const currentTask = getTaskById(Number(taskId));
    currentTask
      .then((task) => {
        setApplicationName(task.application?.name);
        setApplicationId(task.application?.id);
      })
      .catch((error) => {
        console.error("Error fetching task:", error);
      });
  }, [taskId]);
  const appName: string = applicationName ?? t("terms.unknown");
  console.log(appName);
  const detailsPath = formatPath(Paths.taskDetails, { taskId });

  return (
    <TaskDetailsBase
      breadcrumbs={[
        {
          title: t(result ? "terms.applications" : "terms.tasks"),
          path: result ? Paths.applications : Paths.tasks,
        },
        result
          ? {
              title: appName,
              path: `${Paths.applications}/?activeItem=${applicationId}`,
            }
          : null,
        {
          title: t("titles.taskWithId", { taskId }),
          path: detailsPath,
        },
      ].filter(Boolean)}
      detailsPath={detailsPath}
      formatTitle={(taskName) => `Task details for task ${taskId}, ${taskName}`}
      formatAttachmentPath={(attachmentId) =>
        formatPath(Paths.taskDetailsAttachment, {
          taskId,
          attachmentId,
        })
      }
      taskId={Number(taskId)}
      attachmentId={attachmentId}
    />
  );
};
export default TaskDetails;
