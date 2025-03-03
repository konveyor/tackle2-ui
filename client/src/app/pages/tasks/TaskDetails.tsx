import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Paths, TaskDetailsAttachmentRoute } from "@app/Paths";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { formatPath } from "@app/utils/utils";
import { TaskDetailsBase } from "./TaskDetailsBase";
import { useFetchApplicationById } from "@app/queries/applications";

export const TaskDetails = () => {
  const { t } = useTranslation();
  const { taskId, attachmentId, applicationId } =
    useParams<TaskDetailsAttachmentRoute>();
  const currentPath = window.location.pathname;
  const isFromApplication = currentPath.includes("application") ? true : false;
  const isContainApplicationId = currentPath.includes(applicationId)
    ? true
    : false;
  const { application } = useFetchApplicationById(applicationId);

  const appName: string = application?.name ?? t("terms.unknown");
  console.log(appName);
  const detailsPath = isFromApplication
    ? formatPath(Paths.applicationsTaskDetails, {
        applicationId: applicationId,
        taskId: taskId,
      })
    : formatPath(Paths.taskDetails, { taskId });

  return (
    <TaskDetailsBase
      breadcrumbs={[
        {
          title: t(isFromApplication ? "terms.applications" : "terms.tasks"),
          path: isFromApplication ? Paths.applications : Paths.tasks,
        },
        isFromApplication && isContainApplicationId
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
