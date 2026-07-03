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

import { UserRole as Role } from "@app/api/models";

import { ROLE_DEFAULTS, RoleForm, RoleFormValues } from "./role-form";
import { useRoleActionsWithNotifications } from "./use-roles";

export interface RoleModalProps {
  name: string;
  scopes: string[];
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
      scopes={cloneFrom?.scopes ?? ROLE_DEFAULTS.scopes}
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
      scopes={role.scopes}
      roleToEdit={role}
      onClose={onClose}
    />
  );

const schema = object().shape({
  name: string().required(),
  scopes: array().of(string()).required(),
});

const RoleModal: FC<RoleModalProps> = ({
  name,
  scopes,
  roleToEdit,
  onClose,
}) => {
  const { t } = useTranslation();
  const { createRole, editRole } = useRoleActionsWithNotifications();

  const form = useForm<RoleFormValues>({
    defaultValues: { name, scopes },
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
        { ...roleToEdit, name: values.name, scopes: values.scopes },
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
            ouiaId={roleToEdit ? "role-save-button" : "role-create-button"}
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
