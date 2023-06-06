import * as React from "react";
import { Button, Modal, Tab, Tabs } from "@patternfly/react-core";
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
    result: { data: firstFiveIncidents, total: totalNumIncidents },
    isFetching,
    fetchError,
  } = useFetchIssueIncidents(fileReport.issueId, {
    filters: [{ field: "file", operator: "=", value: fileReport.file }],
    page: { pageNumber: 1, itemsPerPage: 5 },
  });

  console.log({ firstFiveIncidents, totalNumIncidents });

  // TODO should the last tab be "All incidents" or "Remaining incidents"? Need some hard-coded offset if the latter

  type TabKey = number | "all";
  const [activeTabIncidentId, setActiveTabIncidentId] =
    React.useState<TabKey>();
  // Auto-select the first tab once incidents are loaded
  React.useEffect(() => {
    if (!activeTabIncidentId && !isFetching && firstFiveIncidents.length > 0) {
      setActiveTabIncidentId(firstFiveIncidents[0].id);
    }
  }, [activeTabIncidentId, isFetching, firstFiveIncidents]);

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
        <Tabs
          activeKey={activeTabIncidentId}
          onSelect={(_event, tabKey) =>
            setActiveTabIncidentId(tabKey as number | "all")
          }
        >
          {firstFiveIncidents.map((incident, index) => (
            <Tab
              key={incident.id}
              eventKey={incident.id}
              title={`Incident #${index + 1}: Line ${incident.line}`} // TODO i18n
            >
              TODO
            </Tab>
          ))}
          {totalNumIncidents > 5 ? (
            <Tab eventKey="all" title="All incidents">
              TODO: All
            </Tab>
          ) : null}
        </Tabs>
      )}
    </Modal>
  );
};
