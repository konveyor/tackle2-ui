import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";

import { Paths } from "@app/Paths";
import { TaskDetailsBase } from "@app/pages/tasks/TaskDetailsBase";
import { useFetchApplicationById } from "@app/queries/applications";
import { formatPath } from "@app/utils/utils";

import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";

export const AnalysisDetails = () => {
  const { applicationId, taskId, attachmentId } = useParams<
    "applicationId" | "taskId" | "attachmentId"
  >();
  const parsedApplicationId = Number(applicationId);
  const parsedTaskId = Number(taskId);
  if (
    !Number.isInteger(parsedApplicationId) ||
    parsedApplicationId <= 0 ||
    !Number.isInteger(parsedTaskId) ||
    parsedTaskId <= 0
  ) {
    return <Navigate to={Paths.applications} replace />;
  }

  return (
    <AnalysisDetailsContent
      applicationId={parsedApplicationId}
      taskId={parsedTaskId}
      attachmentId={attachmentId}
    />
  );
};

const AnalysisDetailsContent = ({
  applicationId,
  taskId,
  attachmentId,
}: {
  applicationId: number;
  taskId: number;
  attachmentId?: string;
}) => {
  const { t } = useTranslation();
  const detailsPath = formatPath(Paths.applicationsAnalysisDetails, {
    applicationId,
    taskId,
  });

  const { application } = useFetchApplicationById(applicationId);
  const appName: string = application?.name ?? t("terms.unknown");

  return (
    <TaskDetailsBase
      breadcrumbs={[
        {
          title: t("terms.applications"),
          path: Paths.applications,
        },
        {
          title: appName,
          path: `${Paths.applications}/?activeItem=${applicationId}`,
        },
        {
          title: t("actions.analysisDetails"),
          path: detailsPath,
        },
      ]}
      detailsPath={detailsPath}
      formatTitle={(taskName) => `Analysis details for ${taskName}`}
      formatAttachmentPath={(attachmentId) =>
        formatPath(Paths.applicationsAnalysisDetailsAttachment, {
          applicationId,
          taskId,
          attachmentId,
        })
      }
      taskId={taskId}
      attachmentId={attachmentId}
    />
  );
};
