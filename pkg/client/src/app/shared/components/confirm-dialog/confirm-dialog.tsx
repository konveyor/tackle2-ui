import React from "react";
import {
  Button,
  Modal,
  ButtonVariant,
  ModalVariant,
} from "@patternfly/react-core";

export interface ConfirmDialogProps {
  isOpen: boolean;

  title: string;
  titleIconVariant?:
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "default"
    | React.ComponentType<any>;
  message: string | React.ReactNode;

  confirmBtnLabel: string;
  cancelBtnLabel: string;

  inProgress?: boolean;
  confirmBtnVariant: ButtonVariant;

  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  titleIconVariant,
  message,
  confirmBtnLabel,
  cancelBtnLabel,
  inProgress,
  confirmBtnVariant,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const confirmBtn = (
    <Button
      key="confirm"
      aria-label="confirm"
      variant={confirmBtnVariant}
      isDisabled={inProgress}
      onClick={onConfirm}
    >
      {confirmBtnLabel}
    </Button>
  );

  const cancelBtn = onCancel ? (
    <Button
      key="cancel"
      aria-label="cancel"
      variant={ButtonVariant.link}
      isDisabled={inProgress}
      onClick={onCancel}
    >
      {cancelBtnLabel}
    </Button>
  ) : undefined;

  return (
    <Modal
      variant={ModalVariant.small}
      title={title}
      titleIconVariant={titleIconVariant}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="confirm-dialog"
      actions={onCancel ? [confirmBtn, cancelBtn] : [confirmBtn]}
    >
      {message}
    </Modal>
  );
};
