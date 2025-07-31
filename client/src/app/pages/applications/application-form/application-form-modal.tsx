import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Modal } from "@patternfly/react-core";

import { Application } from "@app/api/models";
import { ApplicationForm } from "./application-form";
import { useApplicationForm } from "./useApplicationForm";

export interface ApplicationFormModalProps {
  application: Application | null;
  onClose: () => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  application,
  onClose,
}) => {
  const { t } = useTranslation();
  const formProps = useApplicationForm({ application, onClose });
  return (
    <Modal
      title={
        application
          ? t("dialog.title.updateApplication")
          : t("dialog.title.newApplication")
      }
      variant="medium"
      isOpen={true}
      onClose={onClose}
      actions={[
        <Button
          key="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={formProps.isSubmitDisabled}
          onClick={formProps.onSubmit}
        >
          {!application ? t("actions.create") : t("actions.save")}
        </Button>,
        <Button
          key="cancel"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={formProps.isCancelDisabled}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>,
      ]}
    >
      <ApplicationForm {...formProps} />
    </Modal>
  );
};
