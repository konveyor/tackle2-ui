import { ButtonVariant } from "@patternfly/react-core";
import { createAction } from "typesafe-actions";

interface Item {
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
  confirmBtnVariant: ButtonVariant;
  onConfirm: () => void;
}

export const openDialog = createAction("dialog/confirm/open")<Item>();
export const closeDialog = createAction("dialog/confirm/close")<void>();
export const processing = createAction("dialog/confirm/processing")<void>();
