import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Modal, Text } from "@patternfly/react-core";

import { ConfirmDialog, PageHeader } from "@app/shared/components";
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

  const [applicationDependenciesToManage, setApplicationDependenciesToManage] =
    React.useState<Application | null>(null);

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
              <Button
                onClick={() => setApplicationDependenciesToManage(application)}
              >
                {t("actions.manageDependencies")}
              </Button>
            )}
          </>
        }
        menuActions={[]}
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
          <ApplicationDependenciesFormContainer
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
          onConfirm={() => history.push(Paths.applications)}
        />
      )}
    </>
  );
};
