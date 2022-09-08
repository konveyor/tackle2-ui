import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { Tag } from "@app/api/models";

import { TagForm } from "../tag-form";

export interface UpdateTagModalProps {
  tag?: Tag;
  onSaved: (response: AxiosResponse<Tag>) => void;
  onCancel: () => void;
}

export const UpdateTagModal: React.FC<UpdateTagModalProps> = ({
  tag,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateTag")}
      variant={ModalVariant.medium}
      isOpen={!!tag}
      onClose={onCancel}
    >
      <TagForm tag={tag} onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
