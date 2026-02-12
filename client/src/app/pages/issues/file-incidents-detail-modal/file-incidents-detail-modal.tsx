import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Grid,
  GridItem,
  Modal,
  Tab,
  Tabs,
  Text,
  TextContent,
  Truncate,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { AnalysisInsight, AnalysisReportFile } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { StateError } from "@app/components/StateError";
import { IncidentCodeSnipViewer } from "@app/components/code-snip-viewer";
import { InsightDescriptionAndLinks } from "@app/components/insights/components";
import { useFetchIncidentsForInsight } from "@app/queries/analysis";

import { getIssueTitle } from "../helpers";

import { FileAllIncidentsTable } from "./file-all-incidents-table";

export interface IFileIncidentsDetailModalProps {
  issue: AnalysisInsight;
  fileReport: AnalysisReportFile;
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
  } = useFetchIncidentsForInsight(fileReport.insightId, {
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

  const issueTitle = getIssueTitle(issue);

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
                        key={incident.id}
                        markerMessage={issueTitle}
                        incident={incident}
                      />
                    </GridItem>
                    <GridItem span={6} className={spacing.plSm}>
                      <TextContent>
                        <Text component="h2">
                          <Truncate content={issueTitle} />
                        </Text>
                        <Text component="small">Line {incident.line}</Text>
                      </TextContent>
                      <InsightDescriptionAndLinks
                        className={spacing.mtLg}
                        description={incident.message}
                        links={issue.links}
                      />
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
                  title="Highlights available for the first 5 incidents per file to enhance system performance." // TODO i18n
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
