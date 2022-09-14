import { RootState } from "../rootReducer";
import { stateKey } from "./reducer";

export const confirmDialogState = (state: RootState) => state[stateKey];

export const isProcessing = (state: RootState) =>
  confirmDialogState(state).isProcessing;

export const isOpen = (state: RootState) => confirmDialogState(state).isOpen;

export const modal = (state: RootState) => ({
  title: confirmDialogState(state).title,
  titleIconVariant: confirmDialogState(state).titleIconVariant,
  message: confirmDialogState(state).message,
  confirmBtnLabel: confirmDialogState(state).confirmBtnLabel,
  cancelBtnLabel: confirmDialogState(state).cancelBtnLabel,
  confirmBtnVariant: confirmDialogState(state).confirmBtnVariant,
});

export const onConfirm = (state: RootState) =>
  confirmDialogState(state).onConfirm;
