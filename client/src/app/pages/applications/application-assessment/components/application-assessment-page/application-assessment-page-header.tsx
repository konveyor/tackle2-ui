import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Modal, Text } from "@patternfly/react-core";

import { ConfirmDialog, PageHeader } from "@app/shared/components";
import { useEntityModal } from "@app/shared/hooks";
import { ApplicationDependenciesFormContainer } from "@app/shared/containers";
import { Paths } from "@app/Paths";
import { Application, Assessment } from "@app/api/models";
import { getApplicationById } from "@app/api/rest";

export interface IApplicationAssessmentPageHeaderProps {
  assessment?: Assessment;
}

export const ApplicationAssessmentPageHeader: React.FC<
  IApplicationAssessmentPageHeaderProps
> = ({ assessment }) => {
  const { t } = useTranslation();
  const history = useHistory();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    React.useState<Boolean>(false);

  const [application, setApplication] = useState<Application>();

  useEffect(() => {
    if (assessment) {
      getApplicationById(assessment.applicationId).then(({ data }) => {
        setApplication(data);
      });
    }
  }, [assessment]);

  // Dependencies modal
  const {
    isOpen: isDependenciesModalOpen,
    data: applicationToManageDependencies,
    update: openDependenciesModal,
    close: closeDependenciesModal,
  } = useEntityModal<Application>();

  return (
    <>
      <PageHeader
        title={t("composed.applicationAssessment")}
        description={<Text component="p">{application?.name}</Text>}
        breadcrumbs={[
          {
            title: t("terms.applications"),
            path: () => {
              setIsConfirmDialogOpen(true);
            },
          },
          {
            title: t("terms.assessment"),
            path: Paths.applicationsAssessment,
          },
        ]}
        btnActions={
          <>
            {application && (
              <Button onClick={() => openDependenciesModal(application)}>
                {t("actions.manageDependencies")}
              </Button>
            )}
          </>
        }
        menuActions={[]}
      />

      <Modal
        isOpen={isDependenciesModalOpen}
        variant="medium"
        title={t("composed.manageDependenciesFor", {
          what: applicationToManageDependencies?.name,
        })}
        onClose={closeDependenciesModal}
      >
        {applicationToManageDependencies && (
          <ApplicationDependenciesFormContainer
            application={applicationToManageDependencies}
            onCancel={closeDependenciesModal}
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
          onConfirm={() => history.push(Paths.applications)}
        />
      )}
    </>
  );
};
