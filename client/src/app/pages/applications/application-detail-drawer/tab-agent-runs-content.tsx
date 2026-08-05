import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert, Content } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { DevPaths } from "@app/Paths";
import { runHubCoordinates } from "@app/api/agentic/contract";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { useFetchAgentRuns } from "@app/queries/agent-runs";
import { useFetchWorkflowRuns } from "@app/queries/workflow-runs";
import { formatAge } from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { DecoratedApplication } from "../useDecoratedApplications";

/** A run of either kind, flattened to what this table shows. */
interface RunRow {
  name: string;
  kind: "workflow" | "agent";
  subject: string;
  phase?: "Pending" | "Running" | "Succeeded" | "Failed";
  age: string;
  path: string;
}

export const TabAgentRunsContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const { workflowRuns, fetchError: workflowError } = useFetchWorkflowRuns();
  const { agentRuns, fetchError: agentError } = useFetchAgentRuns();

  const applicationId = String(application.id);

  // The application link rides in the run's spec.env APP_ID — runs carry no
  // application label yet, so there is nothing to select on server-side and
  // this filters the full list client-side. Fine at present scale; move to a
  // selector once ibolton336/agentcontroller-client#3 lands.
  const rows: RunRow[] = React.useMemo(() => {
    const fromWorkflows = workflowRuns
      .filter((run) => runHubCoordinates(run.spec.env).appId === applicationId)
      .map<RunRow>((run) => ({
        name: run.metadata.name ?? "",
        kind: "workflow",
        subject: run.spec.workflowRef,
        phase: run.status?.phase,
        age: formatAge(run.metadata.creationTimestamp),
        path: formatPath(DevPaths.workflowRunDetails, {
          runName: run.metadata.name ?? "",
        }),
      }));

    const fromAgents = agentRuns
      .filter((run) => runHubCoordinates(run.spec.env).appId === applicationId)
      .map<RunRow>((run) => ({
        name: run.metadata.name ?? "",
        kind: "agent",
        subject: run.spec.agentRef,
        phase: run.status?.phase,
        age: formatAge(run.metadata.creationTimestamp),
        path: formatPath(DevPaths.agentRunDetails, {
          runName: run.metadata.name ?? "",
        }),
      }));

    return [...fromWorkflows, ...fromAgents].sort((a, b) =>
      a.name < b.name ? 1 : -1
    );
  }, [workflowRuns, agentRuns, applicationId]);

  const fetchError = workflowError ?? agentError;

  return (
    <div className={spacing.mtLg}>
      {fetchError && (
        <Alert
          variant="warning"
          isInline
          title={t("agentic.applicationRuns.loadFailed")}
          className={spacing.mbMd}
        />
      )}
      {rows.length === 0 ? (
        <Content>
          <p>{t("agentic.applicationRuns.empty")}</p>
        </Content>
      ) : (
        <Table
          aria-label={t("agentic.applicationRuns.tableAria")}
          variant="compact"
        >
          <Thead>
            <Tr>
              <Th>{t("terms.name")}</Th>
              <Th>{t("terms.type")}</Th>
              <Th>{t("terms.status")}</Th>
              <Th>{t("terms.age")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map((row) => (
              <Tr key={`${row.kind}-${row.name}`}>
                <Td>
                  <Link to={row.path}>{row.name}</Link>
                </Td>
                <Td>{row.subject}</Td>
                <Td>
                  <PhaseLabel phase={row.phase} />
                </Td>
                <Td>{row.age}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
};
