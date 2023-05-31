import * as React from "react";
import { Button, Modal } from "@patternfly/react-core";
import { AnalysisFileReport } from "@app/api/models";

export interface IIssueAffectedFileDetailModalProps {
  fileReport: AnalysisFileReport;
  onClose: () => void;
}

export const IssueAffectedFileDetailModal: React.FC<
  IIssueAffectedFileDetailModalProps
> = ({ fileReport, onClose }) => {
  return (
    <Modal
      title={fileReport.file}
      variant="large"
      isOpen
      onClose={onClose}
      actions={[
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      TODO: incidents for file {fileReport.file}
    </Modal>
  );
};
