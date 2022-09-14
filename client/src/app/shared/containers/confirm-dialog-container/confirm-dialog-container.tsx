import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "@app/store/rootReducer";

import { ConfirmDialog } from "@app/shared/components";
import {
  confirmDialogActions,
  confirmDialogSelectors,
} from "@app/store/confirmDialog";

export const ConfirmDialogContainer: React.FC = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector((state: RootState) =>
    confirmDialogSelectors.isOpen(state)
  );
  const isProcessing = useSelector((state: RootState) =>
    confirmDialogSelectors.isProcessing(state)
  );

  const modal = useSelector((state: RootState) =>
    confirmDialogSelectors.modal(state)
  );

  const onConfirm = useSelector((state: RootState) =>
    confirmDialogSelectors.onConfirm(state)
  );

  const onCancel = () => {
    dispatch(confirmDialogActions.closeDialog());
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={modal.title}
      titleIconVariant={modal.titleIconVariant}
      message={modal.message}
      inProgress={isProcessing}
      onClose={onCancel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmBtnLabel={modal.confirmBtnLabel}
      cancelBtnLabel={modal.cancelBtnLabel}
      confirmBtnVariant={modal.confirmBtnVariant}
    />
  );
};
