import { FC, useEffect } from "react";
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
import { create as array } from "yup/lib/array";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";

import { Role } from "../types";

import { RoleForm, RoleFormValues, ROLE_DEFAULTS } from "./role-form";
import { useRoleActionsWithNotifications } from "./use-roles";

export interface RoleModalProps {
  isOpen: boolean;
  role?: Role;
  onClose: () => void;
}

export const RoleCreateModal: FC<Omit<RoleModalProps, "role">> = ({
  isOpen,
  onClose,
}) => <RoleModal isOpen={isOpen} onClose={onClose} />;

export const RoleEditModal: FC<Omit<RoleModalProps, "isOpen">> = ({
  role,
  onClose,
}) => <RoleModal isOpen={!!role} role={role} onClose={onClose} />;

const schema = object().shape({
  name: string().required(),
  permissions: array().of(object()).required(),
});

const RoleModal: FC<RoleModalProps> = ({ isOpen, role, onClose }) => {
  const { t } = useTranslation();
  const { createRole, editRole } = useRoleActionsWithNotifications();

  const form = useForm<RoleFormValues>({
    defaultValues: role
      ? { name: role.name, permissions: role.permissions }
      : ROLE_DEFAULTS,
    resolver: yupResolver(schema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting, isValidating, isDirty },
    reset,
  } = form;

  // Reset whenever the role being edited changes
  useEffect(() => {
    if (role) {
      reset({ name: role.name, permissions: role.permissions });
    } else {
      reset(ROLE_DEFAULTS);
    }
  }, [role?.id]);

  const handleClose = () => {
    reset(ROLE_DEFAULTS);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    if (role) {
      editRole(
        { ...role, name: values.name, permissions: values.permissions },
        { onSuccess: handleClose }
      );
    } else {
      createRole(values, { onSuccess: handleClose });
    }
  });

  return (
    <>
      {isOpen && (
        <Modal isOpen onClose={handleClose} variant="medium">
          <ModalHeader
            title={role ? t("titles.editRole") : t("titles.createRole")}
          />
          <ModalBody>
            <RoleForm form={form} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
              onClick={onSubmit}
            >
              {role ? t("actions.save") : t("actions.create")}
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
