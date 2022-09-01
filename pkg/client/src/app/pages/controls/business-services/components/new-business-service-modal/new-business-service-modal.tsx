import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { BusinessService } from "@app/api/models";

import { BusinessServiceForm } from "../business-service-form";

export interface NewBusinessServiceModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<BusinessService>) => void;
  onCancel: () => void;
}

export const NewBusinessServiceModal: React.FC<
  NewBusinessServiceModalProps
> = ({ isOpen, onSaved, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newBusinessService")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <BusinessServiceForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
