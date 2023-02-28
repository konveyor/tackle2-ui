import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { TagCategory } from "@app/api/models";

import { TagCategoryForm } from "../tag-category-form";

export interface NewTagCategoryModalProps {
  isOpen: boolean;
  onSaved: (response: AxiosResponse<TagCategory>) => void;
  onCancel: () => void;
}

export const NewTagCategoryModal: React.FC<NewTagCategoryModalProps> = ({
  isOpen,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.newTagCategory")}
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onCancel}
    >
      <TagCategoryForm onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  );
};
