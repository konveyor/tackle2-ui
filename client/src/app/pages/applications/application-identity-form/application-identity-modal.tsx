import * as React from "react";
import { Modal, ModalBody, ModalHeader } from "@patternfly/react-core";

import { DecoratedApplication } from "../useDecoratedApplications";

import { ApplicationIdentityForm } from "./application-identity-form";

export const ApplicationIdentityModal: React.FC<{
  applications: DecoratedApplication[] | null;
  onClose: () => void;
}> = ({ applications, onClose }) => {
  if (!applications) {
    return null;
  }

  return (
    <Modal
      isOpen={true}
      variant="medium"
      onClose={onClose}
    >
      <ModalHeader title="Manage credentials" />
      <ModalBody>
        <ApplicationIdentityForm applications={applications} onClose={onClose} />
      </ModalBody>
    </Modal>
  );
};
