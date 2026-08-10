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
import type { AgentRun } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";
import { useFetchAgentRuns } from "@app/queries/agent-runs";
import { formatAge, formatDuration } from "@app/utils/agentic";
import { formatPath } from "@app/utils/utils";

import { CreateRunModal } from "./components/CreateRunModal";
import { PhaseLabel } from "./components/PhaseLabel";

import "./agent-runs.css";

const AgentRunsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { agentRuns, isLoading, fetchError } = useFetchAgentRuns();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const sortedRuns = [...agentRuns].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const openRun = (name: string) => {
    history.push(formatPath(DevPaths.agentRunDetails, { runName: name }));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.agentRuns")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && agentRuns.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  {t("agentic.agentRuns.createRun")}
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
              titleText={t("agentic.agentRuns.emptyTitle")}
            >
              <EmptyStateBody>
                {t("agentic.agentRuns.emptyBody")}
              </EmptyStateBody>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                {t("agentic.agentRuns.createRun")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.agentRuns")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.agent")}</Th>
                  <Th>{t("terms.phase")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th>{t("terms.duration")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedRuns.map((run: AgentRun) => {
                  const name = run.metadata.name ?? "";
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>
                        <Link
                          to={formatPath(DevPaths.agentRunDetails, {
                            runName: name,
                          })}
                        >
                          {name}
                        </Link>
                      </Td>
                      <Td dataLabel={t("terms.agent")}>{run.spec.agentRef}</Td>
                      <Td dataLabel={t("terms.phase")}>
                        <PhaseLabel phase={run.status?.phase} />
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(run.metadata.creationTimestamp)}
                      </Td>
                      <Td dataLabel={t("terms.duration")}>
                        {formatDuration(run.status?.duration)}
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
        <CreateRunModal
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

export default AgentRunsPage;
