import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Modal } from "@patternfly/react-core";

import { Application } from "@app/api/models";
import { ApplicationForm } from "./application-form";
import { useApplicationForm } from "./useApplicationForm";
import { useApplicationFormData } from "./useApplicationFormData";

export interface ApplicationFormModalProps {
  application: Application | null;
  onClose: () => void;
  isOpen?: boolean;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  application,
  onClose,
  isOpen = true,
}) => {
  const { t } = useTranslation();
  const data = useApplicationFormData({
    onActionSuccess: onClose,
  });
  const { form, onSubmit, isSubmitDisabled, isCancelDisabled } =
    useApplicationForm({
      application,
      data,
    });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      title={
        application
          ? t("dialog.title.updateApplication")
          : t("dialog.title.newApplication")
      }
      variant="medium"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={isSubmitDisabled}
          onClick={onSubmit}
        >
          {!application ? t("actions.create") : t("actions.save")}
        </Button>,
        <Button
          key="cancel"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isCancelDisabled}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>,
      ]}
    >
      <ApplicationForm application={application} form={form} data={data} />
    </Modal>
  );
};
