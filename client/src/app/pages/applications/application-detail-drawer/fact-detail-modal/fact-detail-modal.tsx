import * as React from "react";
import { Button, Modal } from "@patternfly/react-core";
import { FactCodeSnipViewer } from "./fact-code-snip-viewer";
import { Fact } from "@app/api/models";

export interface IFactDetailModalProps {
  fact: Fact;
  onClose: () => void;
}

export const FactDetailModal: React.FC<IFactDetailModalProps> = ({
  fact,
  onClose,
}) => {
  return (
    <Modal
      title={fact.name}
      variant="large"
      isOpen
      onClose={onClose}
      actions={[
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <FactCodeSnipViewer fact={fact}></FactCodeSnipViewer>
    </Modal>
  );
};
