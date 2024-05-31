import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageSection } from "@patternfly/react-core";

import { AnalysisDetailsRoute, Paths } from "@app/Paths";
import { PageHeader } from "@app/components/PageHeader";
import { formatPath } from "@app/utils/utils";
import { SimpleDocumentViewer } from "@app/components/SimpleDocumentViewer";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchTaskByID } from "@app/queries/tasks";

export const AnalysisDetails: React.FC = () => {
  // i18
  const { t } = useTranslation();

  // Router
  const { applicationId, taskId } = useParams<AnalysisDetailsRoute>();

  const { application } = useFetchApplicationById(applicationId);
  const { task } = useFetchTaskByID(Number(taskId));
  const taskName =
    (typeof task != "string" ? task?.name : taskId) ?? t("terms.unknown");
  const appName = application?.name ?? t("terms.unknown") ?? "";

  return (
    <>
      <PageSection variant="light">
        <PageHeader
          title={`Analysis details for ${taskName}`}
          breadcrumbs={[
            {
              title: t("terms.applications"),
              path: Paths.applications,
            },
            {
              title: appName,
            },
            {
              title: t("actions.analysisDetails"),
              path: formatPath(Paths.applicationsAnalysisDetails, {
                applicationId: applicationId,
                taskId: taskId,
              }),
            },
          ]}
        />
      </PageSection>
      <PageSection className="simple-task-viewer-container">
        <SimpleDocumentViewer documentId={Number(taskId)} height="full" />
      </PageSection>
    </>
  );
};
