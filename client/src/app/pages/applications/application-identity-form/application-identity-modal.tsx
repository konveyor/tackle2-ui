import React from "react";
import { Modal } from "@patternfly/react-core";
import { ApplicationIdentityForm } from "./application-identity-form";
import { DecoratedApplication } from "../useDecoratedApplications";

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
      title="Manage credentials"
      onClose={onClose}
    >
      <ApplicationIdentityForm applications={applications} onClose={onClose} />
    </Modal>
  );
};
