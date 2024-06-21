import React from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageSection } from "@patternfly/react-core";

import { Paths, TaskDetailsAttachmentRoute } from "@app/Paths";
import { PageHeader, PageHeaderProps } from "@app/components/PageHeader";
import {
  DocumentId,
  SimpleDocumentViewer,
} from "@app/components/simple-document-viewer";
import { useFetchTaskByID } from "@app/queries/tasks";
import "@app/components/simple-document-viewer/SimpleDocumentViewer.css";
import { formatPath } from "@app/utils/utils";

export const TaskDetailsBase: React.FC<{
  breadcrumbs: PageHeaderProps["breadcrumbs"];
  formatTitle: (taskName: string) => string;
  detailsPath: string;
  formatAttachmentPath: (attachmentId: number | string) => string;
  taskId: number;
  attachmentId?: string;
}> = ({
  breadcrumbs,
  formatTitle,
  detailsPath,
  formatAttachmentPath,
  taskId,
  attachmentId,
}) => {
  const { t } = useTranslation();

  const { search } = useLocation();
  const hasMergedParam = new URLSearchParams(search).has("merged");

  const history = useHistory();
  const onDocumentChange = (documentId: DocumentId) =>
    typeof documentId === "number"
      ? history.push(formatAttachmentPath(documentId))
      : history.push({
          pathname: detailsPath,
          search: documentId === "MERGED_VIEW" ? "?merged=true" : undefined,
        });

  const { task } = useFetchTaskByID(taskId);

  const taskName: string = task?.name ?? t("terms.unknown");
  const attachmentName = task?.attached?.find(
    ({ id }) => String(id) === attachmentId
  )?.name;
  const resolvedAttachmentId = attachmentName
    ? Number(attachmentId)
    : undefined;
  const resolvedLogMode = hasMergedParam ? "MERGED_VIEW" : "LOG_VIEW";

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={formatTitle(taskName)}
          breadcrumbs={[
            ...breadcrumbs,
            ...(attachmentName && attachmentId
              ? [
                  {
                    title: t("terms.attachments"),
                  },
                  {
                    title: attachmentName,
                    path: formatAttachmentPath(attachmentId),
                  },
                ]
              : []),
          ]}
        />
      </PageSection>
      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
          }}
          className="simple-task-viewer-container"
        >
          <SimpleDocumentViewer
            // force re-creating viewer via keys
            key={`${task?.id}/${task?.attached?.length}`}
            taskId={task ? taskId : undefined}
            documentId={resolvedAttachmentId || resolvedLogMode}
            attachments={task?.attached ?? []}
            onDocumentChange={onDocumentChange}
            height="full"
          />
        </div>
      </PageSection>
    </>
  );
};

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
          title: t("actions.taskDetails"),
          path: detailsPath,
        },
      ]}
      detailsPath={detailsPath}
      formatTitle={(taskName) => `Details for ${taskName}`}
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
