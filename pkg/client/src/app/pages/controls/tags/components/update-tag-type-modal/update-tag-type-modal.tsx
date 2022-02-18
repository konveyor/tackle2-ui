import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { TagType } from "@app/api/models";

import { TagTypeForm } from "../tag-type-form";

export interface UpdateTagTypeModalProps {
  tagType?: TagType;
  onSaved: (response: AxiosResponse<TagType>) => void;
  onCancel: () => void;
}

export const UpdateTagTypeModal: React.FC<UpdateTagTypeModalProps> = ({
  tagType,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateTagType")}
      variant={ModalVariant.medium}
      isOpen={!!tagType}
      onClose={onCancel}
    >
      <TagTypeForm tagType={tagType} onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
