import * as React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { Fact } from "@app/api/models";

import { FactCodeSnipViewer } from "./fact-code-snip-viewer";

export interface IFactDetailModalProps {
  fact: Fact;
  onClose: () => void;
}

export const FactDetailModal: React.FC<IFactDetailModalProps> = ({
  fact,
  onClose,
}) => {
  return (
    <Modal variant="large" isOpen onClose={onClose}>
      <ModalHeader title={fact.name} />
      <ModalBody>
        <FactCodeSnipViewer fact={fact}></FactCodeSnipViewer>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
