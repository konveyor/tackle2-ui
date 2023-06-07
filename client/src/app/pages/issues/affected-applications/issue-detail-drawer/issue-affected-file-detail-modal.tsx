import * as React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown, { Components } from "react-markdown";
import {
  Button,
  Grid,
  GridItem,
  Modal,
  Tab,
  Tabs,
  TextContent,
  Text,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import { AnalysisAppReport, AnalysisFileReport } from "@app/api/models";
import { useFetchIssueIncidents } from "@app/queries/issues";
import {
  AppPlaceholder,
  NoDataEmptyState,
  StateError,
} from "@app/shared/components";
import { markdownPFComponents } from "@app/components/markdown-pf-components";
import { getOnEditorDidMountWithLineMarker } from "./utils";

import "./issue-affected-file-detail-modal.css";

export interface IIssueAffectedFileDetailModalProps {
  appReport: AnalysisAppReport;
  fileReport: AnalysisFileReport;
  onClose: () => void;
}

export const IssueAffectedFileDetailModal: React.FC<
  IIssueAffectedFileDetailModalProps
> = ({ appReport, fileReport, onClose }) => {
  const { t } = useTranslation();

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

  // TODO should the last tab be "All incidents" or "Remaining incidents"? Need some hard-coded offset if the latter

  type IncidentIdOrAll = number | "all";
  const [activeTabIncidentId, setActiveTabIncidentId] =
    React.useState<IncidentIdOrAll>();
  // Auto-select the first tab once incidents are loaded
  React.useEffect(() => {
    if (!activeTabIncidentId && !isFetching && firstFiveIncidents.length > 0) {
      setActiveTabIncidentId(firstFiveIncidents[0].id);
    }
  }, [activeTabIncidentId, isFetching, firstFiveIncidents]);

  // TODO render incident facts?
  // TODO render documentation links? are those part of the markdown? where do we get them from the hub?

  console.log({ firstFiveIncidents });

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
            setActiveTabIncidentId(tabKey as IncidentIdOrAll)
          }
        >
          {firstFiveIncidents.map((incident, index) => {
            const incidentRelativeLine = 10; // TODO magic number?
            const incidentMessage = appReport.issue.name;
            return (
              <Tab
                key={incident.id}
                eventKey={incident.id}
                title={`Incident #${index + 1}: Line ${incident.line}`} // TODO i18n
              >
                {activeTabIncidentId === incident.id ? ( // Only mount CodeEditor for the active tab
                  <Grid hasGutter className={spacing.mtLg}>
                    <GridItem span={6}>
                      <CodeEditor
                        isReadOnly
                        isDarkTheme
                        isLineNumbersVisible
                        code={incident.codeSnip}
                        options={{
                          renderValidationDecorations: "on", // See https://github.com/microsoft/monaco-editor/issues/311#issuecomment-578026465
                          // TODO figure out magic numbers here and make this accurate - use hub codeSnipStartLine once it exists?
                          // lineNumbers: (lineNumber) =>
                          //  String(incident.line + lineNumber - 1 - 10), // -1 because lineNumber is 1-indexed, - 10 because codeSnip starts 10 lines early
                        }}
                        height="450px"
                        onEditorDidMount={getOnEditorDidMountWithLineMarker(
                          incidentRelativeLine,
                          incidentMessage
                        )}
                        language={Language.java} // TODO can we determine the language from the hub?
                        // TODO see monaco-editor-webpack-plugin setup info for including only resources for supported languages in the build
                      />
                    </GridItem>
                    <GridItem span={6} className={spacing.plSm}>
                      <TextContent>
                        <Text component="h2">{appReport.issue.name}</Text>
                        <Text className={`${textStyles.fontSizeMd}`}>
                          Line {incident.line}
                        </Text>
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
            );
          })}
          {totalNumIncidents > 5 ? (
            <Tab
              eventKey="all"
              title={`All incidents (${totalNumIncidents})`} // TODO i18n
            >
              TODO: All
            </Tab>
          ) : null}
        </Tabs>
      )}
    </Modal>
  );
};
