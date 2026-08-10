import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import {
  Button,
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { DevPaths } from "@app/Paths";
import type { AgentWorkflowRun } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import { useFetchWorkflowRuns } from "@app/queries/workflow-runs";
import {
  formatAge,
  formatDuration,
  workflowRunDuration,
} from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { CreateWorkflowRunModal } from "./components/CreateWorkflowRunModal";

function stagesSummary(run: AgentWorkflowRun): string {
  const stages = run.status?.stages ?? [];
  if (stages.length === 0) return "-";
  const done = stages.filter((s) => s.phase === "Succeeded").length;
  const current = run.status?.currentStage;
  return `${done}/${stages.length}${current ? ` · ${current}` : ""}`;
}

const WorkflowRunsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { workflowRuns, isLoading, fetchError } = useFetchWorkflowRuns();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const sortedRuns = [...workflowRuns].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const openRun = (name: string) => {
    history.push(formatPath(DevPaths.workflowRunDetails, { runName: name }));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.workflowRuns")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && workflowRuns.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  {t("agentic.workflowRuns.create")}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {fetchError ? (
            <StateError />
          ) : sortedRuns.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText={t("agentic.workflowRuns.emptyTitle")}
            >
              <EmptyStateBody>
                {t("agentic.workflowRuns.emptyBody")}
              </EmptyStateBody>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                {t("agentic.workflowRuns.create")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.workflowRuns")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.workflow")}</Th>
                  <Th>{t("terms.phase")}</Th>
                  <Th>{t("terms.stages")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th>{t("terms.duration")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedRuns.map((run: AgentWorkflowRun) => {
                  const name = run.metadata.name ?? "";
                  return (
                    <Tr key={run.metadata.uid ?? name}>
                      <Td dataLabel={t("terms.name")}>
                        <Link
                          to={formatPath(DevPaths.workflowRunDetails, {
                            runName: name,
                          })}
                        >
                          {name}
                        </Link>
                      </Td>
                      <Td dataLabel={t("terms.workflow")}>
                        {run.spec.workflowRef}
                      </Td>
                      <Td dataLabel={t("terms.phase")}>
                        <PhaseLabel phase={run.status?.phase} />
                      </Td>
                      <Td dataLabel={t("terms.stages")}>
                        {stagesSummary(run)}
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(run.metadata.creationTimestamp)}
                      </Td>
                      <Td dataLabel={t("terms.duration")}>
                        {formatDuration(workflowRunDuration(run))}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>

      {isCreateOpen && (
        <CreateWorkflowRunModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(name) => {
            setIsCreateOpen(false);
            openRun(name);
          }}
        />
      )}
    </>
  );
};

export default WorkflowRunsPage;
