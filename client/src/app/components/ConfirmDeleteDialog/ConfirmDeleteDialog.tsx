import React, { FC, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  ModalProps,
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
  Text,
  TextInput,
} from "@patternfly/react-core";

import "./ConfirmDeleteDialog.css";

type ConfirmDeleteDialogProps = {
  cancelBtnLabel?: string;
  deleteBtnLabel?: string;
  deleteObjectMessage: string;
  isOpen: boolean;
  nameToDelete?: string;
  onClose: () => void;
  onConfirmDelete: () => void;
  titleWhat: string;
  titleIconVariant?: ModalProps["titleIconVariant"];
};

const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  cancelBtnLabel,
  deleteBtnLabel,
  deleteObjectMessage,
  isOpen,
  nameToDelete,
  onClose,
  onConfirmDelete,
  titleWhat,
  titleIconVariant = "warning",
}) => {
  const { t } = useTranslation();

  const [nameToDeleteInput, setNameToDeleteInput] = useState<string>("");

  const isDisabled = nameToDeleteInput !== nameToDelete;

  const handleClose = () => {
    setNameToDeleteInput("");
    onClose();
  };

  const handleOnConfirmDelete = () => {
    if (!isDisabled) {
      setNameToDeleteInput("");
      onConfirmDelete();
    }
  };

  const confirmBtn = (
    <Button
      id="confirm-delete-dialog-button"
      key="confirm"
      aria-label="confirm"
      variant={ButtonVariant.danger}
      isDisabled={isDisabled}
      onClick={handleOnConfirmDelete}
    >
      {deleteBtnLabel ?? t("actions.delete")}
    </Button>
  );

  const cancelBtn = (
    <Button
      key="cancel"
      id="cancel-delete-button"
      aria-label="cancel"
      variant={ButtonVariant.link}
      onClick={handleClose}
    >
      {cancelBtnLabel ?? t("actions.cancel")}
    </Button>
  );

  return (
    <Modal
      id="confirm-delete-dialog"
      variant={ModalVariant.small}
      titleIconVariant={titleIconVariant}
      isOpen={isOpen}
      onClose={handleClose}
      aria-label="Confirm delete dialog"
      actions={[confirmBtn, cancelBtn]}
      title={t("dialog.title.delete", {
        what: titleWhat,
      })}
    >
      <Text component="p">{deleteObjectMessage}</Text>
      <Text component="p">{t("dialog.message.delete")}</Text>
      <Text component="p" className="confirm-deletion">
        <Trans i18nKey="dialog.message.confirmDeletion">
          Confirm deletion by typing <strong>{{ nameToDelete }}</strong> below:
        </Trans>
      </Text>
      <TextInput
        id="confirm-deletion-input"
        value={nameToDeleteInput}
        onChange={(_, value) => setNameToDeleteInput(value)}
      />
    </Modal>
  );
};

export default ConfirmDeleteDialog;
