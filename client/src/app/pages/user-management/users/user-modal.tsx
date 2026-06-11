import { FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { User } from "../types";

import { useUserForm } from "./use-user-form";
import { UserForm } from "./user-form";

export interface UserModalProps {
  isOpen: boolean;
  user?: User;
  onClose: () => void;
}

export const UserCreateModal: FC<Omit<UserModalProps, "user">> = ({
  isOpen,
  onClose,
}) => <UserModal isOpen={isOpen} onClose={onClose} />;

export const UserEditModal: FC<Omit<UserModalProps, "isOpen">> = ({
  user,
  onClose,
}) => <UserModal isOpen={!!user} user={user} onClose={onClose} />;

const UserModal: FC<UserModalProps> = ({ isOpen, user, onClose }) => {
  const { t } = useTranslation();

  const { form, onSubmit, isSubmitDisabled } = useUserForm(user);
  return (
    <>
      {isOpen && (
        <Modal isOpen onClose={onClose} variant="medium">
          <ModalHeader
            title={user ? t("tiles.editUser") : t("tiles.createUser")}
          />
          <ModalBody>
            <UserForm form={form} onClose={onClose} onSubmit={onSubmit} />
          </ModalBody>
          <ModalFooter>
            <Button
              key="confirm"
              variant="primary"
              isDisabled={isSubmitDisabled}
              onClick={onSubmit}
            >
              {user ? t("actions.save") : t("actions.create")}
            </Button>
            <Button key="cancel" variant="link" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};
