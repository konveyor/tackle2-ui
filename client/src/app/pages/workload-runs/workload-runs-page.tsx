import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { DevPaths } from "@app/Paths";
import type { AgentWorkloadRun } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import { PhaseLabel } from "@app/pages/agent-runs/components/PhaseLabel";
import {
  useDeleteWorkloadRunMutation,
  useFetchWorkloadRuns,
} from "@app/queries/workload-runs";
import {
  formatAge,
  formatDuration,
  workloadRunDuration,
} from "@app/utils/agentic";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { CreateWorkloadRunModal } from "./components/CreateWorkloadRunModal";

function stagesSummary(run: AgentWorkloadRun): string {
  const stages = run.status?.stages ?? [];
  if (stages.length === 0) return "-";
  const done = stages.filter((s) => s.phase === "Succeeded").length;
  const current = run.status?.currentStage;
  return `${done}/${stages.length}${current ? ` · ${current}` : ""}`;
}

const WorkloadRunsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();
  const { workloadRuns, isLoading, fetchError } = useFetchWorkloadRuns();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deleteMutation = useDeleteWorkloadRunMutation(
    (name) => {
      setDeleteTarget(null);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.workloadRun"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const sortedRuns = [...workloadRuns].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  const openRun = (name: string) => {
    history.push(formatPath(DevPaths.workloadRunDetails, { runName: name }));
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.workloadRuns")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && workloadRuns.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  {t("agentic.workloadRuns.create")}
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
              titleText={t("agentic.workloadRuns.emptyTitle")}
            >
              <EmptyStateBody>
                {t("agentic.workloadRuns.emptyBody")}
              </EmptyStateBody>
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                {t("agentic.workloadRuns.create")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.workloadRuns")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.workload")}</Th>
                  <Th>{t("terms.phase")}</Th>
                  <Th>{t("terms.stages")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th>{t("terms.duration")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedRuns.map((run: AgentWorkloadRun) => {
                  const name = run.metadata.name ?? "";
                  return (
                    <Tr key={run.metadata.uid ?? name}>
                      <Td dataLabel={t("terms.name")}>
                        <Link
                          to={formatPath(DevPaths.workloadRunDetails, {
                            runName: name,
                          })}
                        >
                          {name}
                        </Link>
                      </Td>
                      <Td dataLabel={t("terms.workload")}>
                        {run.spec.workloadRef}
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
                        {formatDuration(workloadRunDuration(run))}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.delete"),
                              onClick: () => setDeleteTarget(name),
                            },
                          ]}
                        />
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
        <CreateWorkloadRunModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={(name) => {
            setIsCreateOpen(false);
            openRun(name);
          }}
        />
      )}

      <ConfirmDialog
        title={t("dialog.title.delete", {
          what: t("terms.workloadRun").toLowerCase(),
        })}
        titleIconVariant="warning"
        isOpen={!!deleteTarget}
        message={t("agentic.workloadRuns.deleteMessage", {
          name: deleteTarget,
        })}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        inProgress={deleteMutation.isLoading}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
      />
    </>
  );
};

export default WorkloadRunsPage;
