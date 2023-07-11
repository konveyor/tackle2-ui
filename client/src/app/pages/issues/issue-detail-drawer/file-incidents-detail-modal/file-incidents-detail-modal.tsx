import * as React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import {
  Button,
  Grid,
  GridItem,
  Modal,
  Tab,
  Tabs,
  TextContent,
  Text,
  Alert,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { AnalysisFileReport, AnalysisIssue } from "@app/api/models";
import { useFetchIncidents } from "@app/queries/issues";
import {
  AppPlaceholder,
  NoDataEmptyState,
  StateError,
} from "@app/shared/components";
import { markdownPFComponents } from "@app/components/markdown-pf-components";
import { IncidentCodeSnipViewer } from "./incident-code-snip-viewer";
import { FileAllIncidentsTable } from "./file-all-incidents-table";

export interface IFileIncidentsDetailModalProps {
  issue: AnalysisIssue;
  fileReport: AnalysisFileReport;
  onClose: () => void;
}

export const FileIncidentsDetailModal: React.FC<
  IFileIncidentsDetailModalProps
> = ({ issue, fileReport, onClose }) => {
  const { t } = useTranslation();

  // Only fetch the first 5 incidents here, the rest are fetched in a separate query in FileAllIncidentsTable
  const {
    result: { data: firstFiveIncidents, total: totalNumIncidents },
    isFetching,
    fetchError,
  } = useFetchIncidents(fileReport.issueId, {
    filters: [{ field: "file", operator: "=", value: fileReport.file }],
    page: { pageNumber: 1, itemsPerPage: 5 },
  });

  type IncidentIdOrAll = number | "all";
  const [activeTabIncidentId, setActiveTabIncidentId] =
    React.useState<IncidentIdOrAll>();
  // Auto-select the first tab once incidents are loaded
  React.useEffect(() => {
    if (!activeTabIncidentId && !isFetching && firstFiveIncidents.length > 0) {
      setActiveTabIncidentId(firstFiveIncidents[0].id);
    }
  }, [activeTabIncidentId, isFetching, firstFiveIncidents]);

  const isLoadingState =
    isFetching ||
    (firstFiveIncidents.length > 0 && activeTabIncidentId === undefined);

  // TODO render incident facts?
  // TODO render documentation links? are those part of the markdown? where do we get them from the hub?

  console.log({ activeTabIncidentId });

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
      {isLoadingState ? (
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
            setActiveTabIncidentId(tabKey as IncidentIdOrAll)
          }
        >
          {[
            firstFiveIncidents.map((incident, index) => (
              <Tab
                key={incident.id}
                eventKey={incident.id}
                title={`Incident #${index + 1}: Line ${incident.line}`} // TODO i18n
              >
                {/* Only mount CodeEditor and ReactMarkdown for the active tab for perf reasons */}
                {activeTabIncidentId === incident.id ? (
                  <Grid hasGutter className={spacing.mtLg}>
                    <GridItem span={6}>
                      <IncidentCodeSnipViewer
                        issueName={issue.name}
                        incident={incident}
                      />
                    </GridItem>
                    <GridItem span={6} className={spacing.plSm}>
                      <TextContent>
                        <Text component="h2">{issue.name}</Text>
                        <Text component="small">Line {incident.line}</Text>
                      </TextContent>
                      <TextContent className={spacing.mtLg}>
                        <ReactMarkdown components={markdownPFComponents}>
                          {incident.message}
                        </ReactMarkdown>
                      </TextContent>
                    </GridItem>
                  </Grid>
                ) : null}
              </Tab>
            )),
            totalNumIncidents > 5 && [
              <Tab
                key="all"
                eventKey="all"
                title={`All incidents (${totalNumIncidents})`} // TODO i18n
              >
                <Alert
                  isInline
                  variant="info"
                  className={spacing.mtMd}
                  title="TODO"
                />
                <FileAllIncidentsTable fileReport={fileReport} />
              </Tab>,
            ],
          ]
            .flat(1)
            .filter(Boolean)}
        </Tabs>
      )}
    </Modal>
  );
};
