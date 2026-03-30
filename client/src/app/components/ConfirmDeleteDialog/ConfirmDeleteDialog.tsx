import { FC, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalHeaderProps,
  ModalVariant,
  TextInput,
} from "@patternfly/react-core";

import { collapseSpacesAndCompare } from "@app/utils/utils";

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
  titleIconVariant?: ModalHeaderProps["titleIconVariant"];
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

  /*
    Enable the delete button once the input name matches the `nameToDelete`, BUT
    collapse spaces since that is the way the name is rendered
   */
  const isDisabled =
    collapseSpacesAndCompare(nameToDeleteInput, nameToDelete) !== 0;

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
      isOpen={isOpen}
      onClose={handleClose}
      aria-label="Confirm delete dialog"
    >
      <ModalHeader
        title={t("dialog.title.delete", {
          what: titleWhat,
        })}
        titleIconVariant={titleIconVariant}
      />
      <ModalBody>
        <p>{deleteObjectMessage}</p>
        <p>{t("dialog.message.delete")}</p>
        <p className="confirm-deletion">
          <Trans
            i18nKey="dialog.message.confirmDeletion"
            values={{ nameToDelete }}
          />
        </p>
        <TextInput
          id="confirm-deletion-input"
          value={nameToDeleteInput}
          onChange={(_, value) => setNameToDeleteInput(value)}
        />
      </ModalBody>
      <ModalFooter>
        {confirmBtn}
        {cancelBtn}
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDeleteDialog;
