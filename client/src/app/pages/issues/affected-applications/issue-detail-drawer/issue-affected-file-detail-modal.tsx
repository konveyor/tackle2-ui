import * as React from "react";
import { Button, Modal } from "@patternfly/react-core";
import { AnalysisFileReport } from "@app/api/models";
import { useFetchIssueIncidents } from "@app/queries/issues";
import {
  AppPlaceholder,
  ConditionalRender,
  NoDataEmptyState,
  StateError,
} from "@app/shared/components";
import { useTranslation } from "react-i18next";

export interface IIssueAffectedFileDetailModalProps {
  fileReport: AnalysisFileReport;
  onClose: () => void;
}

export const IssueAffectedFileDetailModal: React.FC<
  IIssueAffectedFileDetailModalProps
> = ({ fileReport, onClose }) => {
  const { t } = useTranslation();

  console.log({ fileReport });

  // Only fetch the first 5 incidents here, the rest are fetched in a separate query in IssueAffectedFileRemainingIncidentsTable
  // TODO add IssueAffectedFileRemainingIncidentsTable? Should it include all incidents?
  const {
    result: { data: firstFiveIncidents },
    isFetching,
    fetchError,
  } = useFetchIssueIncidents(fileReport.issueId, {
    filters: [{ field: "file", operator: "=", value: fileReport.file }],
    page: { pageNumber: 1, itemsPerPage: 5 },
  });

  console.log({ firstFiveIncidents });

  // TODO dynamic tab state and logic, useEffect to select the first tab if data is present and current tab is null

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
      {isFetching ? (
        <AppPlaceholder />
      ) : fetchError ? (
        <StateError />
      ) : firstFiveIncidents.length === 0 ? (
        <NoDataEmptyState
          title={t("composed.noDataStateTitle", {
            what: "Incidents", // TODO i18n
          })}
        />
      ) : (
        <>
          TODO: incidents for file {fileReport.file}
          {JSON.stringify(firstFiveIncidents, undefined, 2)}
        </>
      )}
    </Modal>
  );
};
