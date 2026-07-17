import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalHeaderProps,
} from "@patternfly/react-core";

export interface ConfirmDialogProps {
  isOpen: boolean;

  title: string;
  titleIconVariant?: ModalHeaderProps["titleIconVariant"];
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
  "aria-label"?: string;
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
  "aria-label": ariaLabel,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      id="confirm-dialog"
      variant="small"
      isOpen={isOpen}
      onClose={onClose}
      aria-label={ariaLabel || t("dialog.title.confirmDialog")}
    >
      <ModalHeader title={title} titleIconVariant={titleIconVariant} />
      <ModalBody>
        {alertMessage ? (
          <Alert variant="warning" isInline title={alertMessage} />
        ) : null}
        {message}
      </ModalBody>
      <ModalFooter>
        <Button
          id="confirm-dialog-button"
          key="confirm"
          aria-label={confirmBtnLabel}
          variant={confirmBtnVariant}
          isDisabled={inProgress}
          onClick={onConfirm}
        >
          {confirmBtnLabel}
        </Button>
        {onCustomAction && (
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
        )}
        {onCancel && (
          <Button
            key="cancel"
            id="confirm-cancel-button"
            aria-label={cancelBtnLabel}
            variant={ButtonVariant.link}
            isDisabled={inProgress}
            onClick={onCancel}
          >
            {cancelBtnLabel}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};
