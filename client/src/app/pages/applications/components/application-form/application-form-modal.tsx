import * as React from "react";
import { Button, ButtonVariant, Modal } from "@patternfly/react-core";
import { ApplicationForm, useApplicationFormHook } from "./application-form";
import { Application } from "@app/api/models";
import { useTranslation } from "react-i18next";

export interface ApplicationFormModalProps {
  application: Application | null;
  onClose: () => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  application,
  onClose,
}) => {
  const { t } = useTranslation();
  const formProps = useApplicationFormHook({ application, onClose });
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
