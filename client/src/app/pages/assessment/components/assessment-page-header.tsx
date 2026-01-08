import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Button, ButtonVariant, Modal, Text } from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import { Application, Assessment } from "@app/api/models";
import { ApplicationDependenciesForm } from "@app/components/ApplicationDependenciesFormContainer/ApplicationDependenciesForm";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { PageHeader } from "@app/components/PageHeader";
import useIsArchetype from "@app/hooks/useIsArchetype";
import { useFetchApplicationById } from "@app/queries/applications";
import { useFetchArchetypeById } from "@app/queries/archetypes";

export interface AssessmentPageHeaderProps {
  assessment?: Assessment;
}

export const AssessmentPageHeader: React.FC<AssessmentPageHeaderProps> = ({
  assessment,
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const isArchetype = useIsArchetype();

  const { archetype } = useFetchArchetypeById(assessment?.archetype?.id);
  const { application } = useFetchApplicationById(assessment?.application?.id);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<boolean>(false);

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    React.useState<Application | null>(null);

  return (
    <>
      <PageHeader
        title={t("composed.applicationAssessment")}
        description={
          <Text component="p">
            {isArchetype ? archetype?.name : application?.name}
          </Text>
        }
        breadcrumbs={[
          {
            title: isArchetype ? t("terms.archetype") : t("terms.applications"),
            path: () => {
              setIsConfirmDialogOpen(true);
            },
          },
          {
            title: t("terms.assessment"),
            path: isArchetype
              ? Paths.archetypesAssessment
              : Paths.applicationsAssessment,
          },
        ]}
        btnActions={
          <>
            {application && (
              <Button
                onClick={() => setApplicationDependenciesToManage(application)}
              >
                {t("actions.manageDependencies")}
              </Button>
            )}
          </>
        }
      />

      <Modal
        isOpen={applicationDependenciesToManage !== null}
        variant="medium"
        title={t("composed.manageDependenciesFor", {
          what: applicationDependenciesToManage?.name,
        })}
        onClose={() => setApplicationDependenciesToManage(null)}
      >
        {applicationDependenciesToManage && (
          <ApplicationDependenciesForm
            application={applicationDependenciesToManage}
            onCancel={() => setApplicationDependenciesToManage(null)}
          />
        )}
      </Modal>
      {isConfirmDialogOpen && (
        <ConfirmDialog
          title={t("dialog.title.leavePage")}
          isOpen={true}
          message={t("dialog.message.leavePage")}
          confirmBtnVariant={ButtonVariant.primary}
          confirmBtnLabel={t("actions.continue")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={() =>
            history.push(isArchetype ? Paths.archetypes : Paths.applications)
          }
        />
      )}
    </>
  );
};
