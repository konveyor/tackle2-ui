import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { BusinessService } from "@app/api/models";

import { BusinessServiceForm } from "../business-service-form";

export interface UpdateBusinessServiceModalProps {
  businessService?: BusinessService;
  onSaved: (response: AxiosResponse<BusinessService>) => void;
  onCancel: () => void;
}

export const UpdateBusinessServiceModal: React.FC<
  UpdateBusinessServiceModalProps
> = ({ businessService, onSaved, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateBusinessService")}
      variant={ModalVariant.medium}
      isOpen={!!businessService}
      onClose={onCancel}
    >
      <BusinessServiceForm
        businessService={businessService}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
