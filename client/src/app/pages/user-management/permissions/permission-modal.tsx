import { FC } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";

import { usePermissionActionsWithNotifications } from "./use-permissions";
import {
  PermissionForm,
  PermissionFormValues,
  PERMISSION_DEFAULTS,
} from "./permission-form";

export interface PermissionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const schema = object().shape({
  name: string().required(),
  scope: string().required(),
});

export const PermissionCreateModal: FC<PermissionCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { createPermission } = usePermissionActionsWithNotifications();

  const form = useForm<PermissionFormValues>({
    defaultValues: PERMISSION_DEFAULTS,
    resolver: yupResolver(schema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting, isValidating, isDirty },
    reset,
  } = form;

  const handleClose = () => {
    reset(PERMISSION_DEFAULTS);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    createPermission(values, { onSuccess: handleClose });
  });

  return (
    <>
      {isOpen && (
        <Modal isOpen onClose={handleClose} variant="small">
          <ModalHeader title={t("titles.createPermission")} />
          <ModalBody>
            <PermissionForm form={form} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
              onClick={onSubmit}
            >
              {t("actions.create")}
            </Button>
            <Button variant="link" onClick={handleClose}>
              {t("actions.cancel")}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
