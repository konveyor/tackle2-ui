import { FC, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalHeaderProps,
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

  return (
    <Modal
      id="confirm-delete-dialog"
      variant="small"
      isOpen={isOpen}
      onClose={handleClose}
      aria-label="Confirm delete dialog"
    >
      <ModalHeader
        titleIconVariant={titleIconVariant}
        title={t("dialog.title.delete", {
          what: titleWhat,
        })}
      />
      <ModalBody>
        <Content component="p">{deleteObjectMessage}</Content>
        <Content component="p">{t("dialog.message.delete")}</Content>
        <Content component="p" className="confirm-deletion">
          <Trans
            i18nKey="dialog.message.confirmDeletion"
            values={{ nameToDelete }}
          />
        </Content>
        <TextInput
          id="confirm-deletion-input"
          value={nameToDeleteInput}
          onChange={(_, value) => setNameToDeleteInput(value)}
        />
      </ModalBody>
      <ModalFooter>
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
        <Button
          key="cancel"
          id="cancel-delete-button"
          aria-label="cancel"
          variant={ButtonVariant.link}
          onClick={handleClose}
        >
          {cancelBtnLabel ?? t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmDeleteDialog;
