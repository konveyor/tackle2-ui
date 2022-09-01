import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Tag } from "@app/api/models";

import { TagForm } from "../tag-form";

export interface NewTagModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<Tag>) => void;
  onCancel: () => void;
}

export const NewTagModal: React.FC<NewTagModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newTag")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <TagForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
