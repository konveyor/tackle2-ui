import { ButtonVariant } from "@patternfly/react-core";
import { ActionType, getType } from "typesafe-actions";
import { closeDialog, openDialog, processing } from "./actions";

export const stateKey = "confirmDialog";

export type ConfirmDialogState = Readonly<{
  isOpen: boolean;
  isProcessing: boolean;

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
}>;

export const defaultState: ConfirmDialogState = {
  isOpen: false,
  isProcessing: false,

  title: "",
  titleIconVariant: undefined,
  message: "",
  confirmBtnLabel: "Confirm",
  cancelBtnLabel: "Cancel",
  confirmBtnVariant: ButtonVariant.primary,

  onConfirm: () => {},
};

export type ConfirmDialogAction = ActionType<
  typeof openDialog | typeof closeDialog | typeof processing
>;

export const reducer = (
  state: ConfirmDialogState = defaultState,
  action: ConfirmDialogAction
): ConfirmDialogState => {
  switch (action.type) {
    case getType(openDialog):
      return {
        ...state,
        ...action.payload,
        isOpen: true,
      };
    case getType(processing):
      return {
        ...state,
        isProcessing: true,
      };
    case getType(closeDialog):
      return defaultState;
    default:
      return state;
  }
};
