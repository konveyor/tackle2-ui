import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Paths, TaskDetailsAttachmentRoute } from "@app/Paths";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { formatPath } from "@app/utils/utils";
import { TaskDetailsBase } from "./TaskDetailsBase";
//path
import { TaskActionColumnProps } from "./TaskActionColumn";
//path
import { useFetchApplicationById } from "@app/queries/applications";
import { AnalysisDetailsAttachmentRoute } from "@app/Paths";
import { TabKey } from "../applications/components/application-detail-drawer/application-detail-drawer";

const { applicationId } = useParams<AnalysisDetailsAttachmentRoute>();
const detailsPath = formatPath(Paths.applicationsAnalysisDetails, {
  applicationId: applicationId,
});
const { application } = useFetchApplicationById(applicationId);

export const TaskDetails = (isFApplication: TaskActionColumnProps) => {
  const { t } = useTranslation();
  //bread
  const appName: string = application?.name ?? t("terms.unknown");

  const { taskId, attachmentId } = useParams<TaskDetailsAttachmentRoute>();
  const detailsPath = isFApplication
    ? formatPath(Paths.applicationsTabTaskDetails, { taskId })
    : formatPath(Paths.taskDetails, { taskId });
  return (
    <TaskDetailsBase
      breadcrumbs={[
        {
          title: t(isFApplication ? "terms.applications" : "terms.tasks"),
          path: isFApplication ? Paths.applications : Paths.tasks,
        },

        {
          title: appName,
          path: `${Paths.applications}/?activeItem=${applicationId}&TabKey=${TabKey.Tasks}`,
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
