import * as React from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@patternfly/react-core";

import { IdentityForm, IdentityFormProps } from "./identity-form";

export interface IdentityFormModalProps extends IdentityFormProps {
  isOpen: boolean;
}

export const IdentityFormModal: React.FC<IdentityFormModalProps> = ({
  isOpen,
  identity,
  onClose,
  ...rest
}) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      id="credential.modal"
      isOpen
      variant="medium"
      title={
        identity
          ? t("dialog.title.update", {
              what: t("terms.credential").toLowerCase(),
            })
          : t("dialog.title.new", {
              what: t("terms.credential").toLowerCase(),
            })
      }
      onClose={onClose}
    >
      <IdentityForm
        key={identity?.id ?? 0}
        identity={identity}
        onClose={onClose}
        {...rest}
      />
    </Modal>
  );
};
