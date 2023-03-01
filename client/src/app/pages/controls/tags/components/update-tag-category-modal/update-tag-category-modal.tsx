import React from "react";
import { AxiosResponse } from "axios";
import { useTranslation } from "react-i18next";

import { Modal, ModalVariant } from "@patternfly/react-core";

import { TagCategory } from "@app/api/models";

import { TagCategoryForm } from "../tag-category-form";

export interface UpdateTagCategoryModalProps {
  tagCategory?: TagCategory;
  onSaved: (response: AxiosResponse<TagCategory>) => void;
  onCancel: () => void;
}

export const UpdateTagCategoryModal: React.FC<UpdateTagCategoryModalProps> = ({
  tagCategory: tagCategory,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t("dialog.title.updateTagCategory")}
      variant={ModalVariant.medium}
      isOpen={!!tagCategory}
      onClose={onCancel}
    >
      <TagCategoryForm
        tagCategory={tagCategory}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </Modal>
  );
};
