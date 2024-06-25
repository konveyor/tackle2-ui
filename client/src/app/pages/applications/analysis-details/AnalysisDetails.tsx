import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AnalysisDetailsAttachmentRoute, Paths } from "@app/Paths";
import { formatPath } from "@app/utils/utils";

import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { TaskDetailsBase } from "@app/pages/tasks/TaskDetailsBase";
import { useFetchApplicationById } from "@app/queries/applications";

export const AnalysisDetails = () => {
  const { t } = useTranslation();
  const { applicationId, taskId, attachmentId } =
    useParams<AnalysisDetailsAttachmentRoute>();
  const detailsPath = formatPath(Paths.applicationsAnalysisDetails, {
    applicationId: applicationId,
    taskId: taskId,
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
          path: formatPath(Paths.applicationsAnalysisDetails, {
            applicationId,
            taskId,
          }),
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
      taskId={Number(taskId)}
      attachmentId={attachmentId}
    />
  );
};
