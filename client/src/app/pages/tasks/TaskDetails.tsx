import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Paths, TaskDetailsAttachmentRoute } from "@app/Paths";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { formatPath } from "@app/utils/utils";
import { TaskDetailsBase } from "./TaskDetailsBase";

export const TaskDetails = () => {
  const { t } = useTranslation();
  const { taskId, attachmentId } = useParams<TaskDetailsAttachmentRoute>();
  const detailsPath = formatPath(Paths.taskDetails, { taskId });
  return (
    <TaskDetailsBase
      breadcrumbs={[
        {
          title: t("terms.tasks"),
          path: Paths.tasks,
        },
        {
          title: t("titles.taskWithId", { taskId }),
          path: detailsPath,
        },
      ]}
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
