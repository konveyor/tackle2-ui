import { FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { User } from "@app/api/models";

import { useUserForm } from "./use-user-form";
import { UserForm } from "./user-form";

export interface UserModalProps {
  user?: User;
  onClose: () => void;
}

// re-create the modal to reset all state
export const UserCreateModal: FC<UserModalProps & { isOpen: boolean }> = ({
  isOpen,
  onClose,
}) => isOpen && <UserModal onClose={onClose} />;

// re-create the modal to reset all state
export const UserEditModal: FC<UserModalProps> = ({ user, onClose }) =>
  !!user && <UserModal user={user} onClose={onClose} />;

const UserModal: FC<UserModalProps> = ({ user, onClose }) => {
  const { t } = useTranslation();

  const { form, onSubmit, isSubmitDisabled, isEdit, isSeeded } = useUserForm(
    user,
    onClose
  );
  return (
    <>
      <Modal isOpen onClose={onClose} variant="medium">
        <ModalHeader
          title={user ? t("titles.editUser") : t("titles.createUser")}
        />
        <ModalBody>
          <UserForm
            form={form}
            isEdit={isEdit}
            isSeeded={isSeeded}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            key="confirm"
            variant="primary"
            isDisabled={isSubmitDisabled}
            onClick={onSubmit}
            data-ouia-component-id={
              user ? "user-save-button" : "user-create-button"
            }
          >
            {user ? t("actions.save") : t("actions.create")}
          </Button>
          <Button key="cancel" variant="link" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
