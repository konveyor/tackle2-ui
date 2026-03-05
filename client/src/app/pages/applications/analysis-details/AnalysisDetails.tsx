import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { Paths } from "@app/Paths";
import { TaskDetailsBase } from "@app/pages/tasks/TaskDetailsBase";
import { useFetchApplicationById } from "@app/queries/applications";
import { formatPath } from "@app/utils/utils";

import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";

export const AnalysisDetails = () => {
  const { t } = useTranslation();
  const { applicationId, taskId, attachmentId } = useParams<
    "applicationId" | "taskId" | "attachmentId"
  >();
  const detailsPath = formatPath(Paths.applicationsAnalysisDetails, {
    applicationId: applicationId!,
    taskId: taskId!,
  });

  const { application } = useFetchApplicationById(applicationId!);
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
          path: `${Paths.applications}/?activeItem=${applicationId!}`,
        },
        {
          title: t("actions.analysisDetails"),
          path: formatPath(Paths.applicationsAnalysisDetails, {
            applicationId: applicationId!,
            taskId: taskId!,
          }),
        },
      ]}
      detailsPath={detailsPath}
      formatTitle={(taskName) => `Analysis details for ${taskName}`}
      formatAttachmentPath={(attachmentId) =>
        formatPath(Paths.applicationsAnalysisDetailsAttachment, {
          applicationId: applicationId!,
          taskId: taskId!,
          attachmentId,
        })
      }
      taskId={Number(taskId!)}
      attachmentId={attachmentId}
    />
  );
};
