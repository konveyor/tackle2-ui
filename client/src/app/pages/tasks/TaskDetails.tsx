import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";

import { Paths } from "@app/Paths";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { useFetchApplicationById } from "@app/queries/applications";
import { formatPath } from "@app/utils/utils";

import { TaskDetailsBase } from "./TaskDetailsBase";

export const TaskDetails = () => {
  const { taskId, attachmentId, applicationId } = useParams<
    "taskId" | "attachmentId" | "applicationId"
  >();
  const fallbackPath =
    applicationId === undefined ? Paths.tasks : Paths.applications;
  if (taskId === undefined) {
    return <Navigate to={fallbackPath} replace />;
  }
  const parsedTaskId = Number(taskId);
  const parsedApplicationId =
    applicationId === undefined ? undefined : Number(applicationId);
  if (
    !Number.isInteger(parsedTaskId) ||
    parsedTaskId <= 0 ||
    (parsedApplicationId !== undefined &&
      (!Number.isInteger(parsedApplicationId) || parsedApplicationId <= 0))
  ) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <TaskDetailsContent
      taskId={parsedTaskId}
      attachmentId={attachmentId}
      applicationId={parsedApplicationId}
    />
  );
};

const TaskDetailsContent = ({
  taskId,
  attachmentId,
  applicationId,
}: {
  taskId: number;
  attachmentId?: string;
  applicationId?: number;
}) => {
  const { t } = useTranslation();
  const isFromApplication = applicationId !== undefined;
  const { application } = useFetchApplicationById(applicationId);

  const appName: string = application?.name ?? t("terms.unknown");
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
        isFromApplication
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
      taskId={taskId}
      attachmentId={attachmentId}
    />
  );
};
export default TaskDetails;
