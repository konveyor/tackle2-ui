import * as React from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Modal,
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
    | React.ComponentType<any>;
  message: string | React.ReactNode;

  confirmBtnLabel: string;
  cancelBtnLabel: string;
  customActionLabel?: string;

  inProgress?: boolean;
  confirmBtnVariant: ButtonVariant;

  alertMessage?: string;

  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  onCustomAction?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  titleIconVariant,
  message,
  confirmBtnLabel,
  cancelBtnLabel,
  customActionLabel,
  inProgress,
  confirmBtnVariant,
  onClose,
  onConfirm,
  onCancel,
  onCustomAction,
  alertMessage,
}) => {
  const confirmBtn = (
    <Button
      id="confirm-dialog-button"
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
      id="confirm-cancel-button"
      aria-label="cancel"
      variant={ButtonVariant.link}
      isDisabled={inProgress}
      onClick={onCancel}
    >
      {cancelBtnLabel}
    </Button>
  ) : undefined;

  const customActionBtn = onCustomAction ? (
    <Button
      key="custom-action"
      id="custom-action-button"
      aria-label={customActionLabel}
      variant={ButtonVariant.secondary}
      isDisabled={inProgress}
      onClick={onCustomAction}
    >
      {customActionLabel}
    </Button>
  ) : undefined;

  const actions = [confirmBtn, customActionBtn, cancelBtn].filter(Boolean);

  return (
    <Modal
      id="confirm-dialog"
      variant={ModalVariant.small}
      title={title}
      titleIconVariant={titleIconVariant}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Confirm dialog"
      actions={actions}
    >
      {alertMessage ? (
        <Alert variant="warning" isInline title={alertMessage} />
      ) : null}
      {message}
    </Modal>
  );
};
