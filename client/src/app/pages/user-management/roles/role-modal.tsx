import { FC } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { create as array } from "yup/lib/array";
import { create as object } from "yup/lib/object";
import { create as string } from "yup/lib/string";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { Ref, UserRole as Role } from "@app/api/models";

import { ROLE_DEFAULTS, RoleForm, RoleFormValues } from "./role-form";
import { useRoleActionsWithNotifications } from "./use-roles";

export interface RoleModalProps {
  name: string;
  permissions: Ref[];
  roleToEdit?: Role;
  onClose: () => void;
}

export const RoleCreateModal: FC<{
  isOpen: boolean;
  cloneFrom?: Role;
  onClose: () => void;
}> = ({ isOpen, cloneFrom, onClose }) =>
  isOpen && (
    <RoleModal
      name={ROLE_DEFAULTS.name}
      permissions={cloneFrom?.permissions ?? ROLE_DEFAULTS.permissions}
      onClose={onClose}
    />
  );

export const RoleEditModal: FC<{ role?: Role; onClose: () => void }> = ({
  role,
  onClose,
}) =>
  !!role && (
    <RoleModal
      name={role.name}
      permissions={role.permissions}
      roleToEdit={role}
      onClose={onClose}
    />
  );

const schema = object().shape({
  name: string().required(),
  permissions: array().of(object()).required(),
});

const RoleModal: FC<RoleModalProps> = ({
  name,
  permissions,
  roleToEdit,
  onClose,
}) => {
  const { t } = useTranslation();
  const { createRole, editRole } = useRoleActionsWithNotifications();

  const form = useForm<RoleFormValues>({
    defaultValues: { name, permissions },
    resolver: yupResolver(schema),
    mode: "all",
  });

  const {
    handleSubmit,
    formState: { isValid, isSubmitting, isValidating, isDirty },
  } = form;

  const onSubmit = handleSubmit((values) => {
    if (roleToEdit) {
      editRole(
        { ...roleToEdit, name: values.name, permissions: values.permissions },
        { onSuccess: onClose }
      );
    } else {
      createRole(values, { onSuccess: onClose });
    }
  });

  return (
    <>
      <Modal isOpen onClose={onClose} variant="medium">
        <ModalHeader
          title={roleToEdit ? t("titles.editRole") : t("titles.createRole")}
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
            {roleToEdit ? t("actions.save") : t("actions.create")}
          </Button>
          <Button variant="link" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
