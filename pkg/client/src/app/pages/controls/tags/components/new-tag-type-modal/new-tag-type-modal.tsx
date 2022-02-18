import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { TagType } from "@app/api/models";

import { TagTypeForm } from "../tag-type-form";

export interface NewTagTypeModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<TagType>) => void;
  onCancel: () => void;
}

export const NewTagTypeModal: React.FC<NewTagTypeModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newTagType")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <TagTypeForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
