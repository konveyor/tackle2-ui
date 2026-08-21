import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
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
  Truncate,
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
import type { AgentWorkflow } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import { CreateWorkflowRunModal } from "@app/pages/workflow-runs/components/CreateWorkflowRunModal";
import {
  useDeleteWorkflowMutation,
  useFetchWorkflows,
} from "@app/queries/workflows";
import { formatAge } from "@app/utils/agentic";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { WorkflowComposerModal } from "./components/WorkflowComposerModal";

function stagesSummary(workflow: AgentWorkflow): string | null {
  const stages = workflow.spec.stages ?? [];
  if (stages.length === 0) return null;
  const names = stages.map((s) => s.name);
  return `${stages.length}: ${names.join(" → ")}`;
}

const WorkflowsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();
  const { workflows, isLoading, fetchError } = useFetchWorkflows();
  const [composerTarget, setComposerTarget] = useState<
    AgentWorkflow | "create" | null
  >(null);
  const [runTarget, setRunTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deleteMutation = useDeleteWorkflowMutation(
    (name) => {
      setDeleteTarget(null);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.workflow"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const sortedWorkflows = [...workflows].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.workflows")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && workflows.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={() => setComposerTarget("create")}
                >
                  {t("agentic.workflows.createWorkflow")}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {fetchError ? (
            <StateError />
          ) : sortedWorkflows.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText={t("agentic.workflows.emptyTitle")}
            >
              <EmptyStateBody>
                {t("agentic.workflows.emptyBody")}
              </EmptyStateBody>
              <EmptyStateBody>{t("agentic.emptyStateSeedHint")}</EmptyStateBody>
              <Button
                variant="primary"
                onClick={() => setComposerTarget("create")}
              >
                {t("agentic.workflows.createWorkflow")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.workflows")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.stages")}</Th>
                  <Th>{t("agentic.workflows.guide")}</Th>
                  <Th>{t("agentic.workflows.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedWorkflows.map((pb: AgentWorkflow) => {
                  const name = pb.metadata.name ?? "";
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.stages")}>
                        {stagesSummary(pb) ?? t("agentic.workflows.zeroStages")}
                      </Td>
                      <Td dataLabel={t("agentic.workflows.guide")}>
                        {pb.spec.guide ? (
                          <Truncate content={pb.spec.guide} />
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td dataLabel={t("agentic.workflows.ready")}>
                        <ReadyLabel conditions={pb.status?.conditions} />
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(pb.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.run"),
                              onClick: () => setRunTarget(name),
                            },
                            {
                              title: t("actions.edit"),
                              onClick: () => setComposerTarget(pb),
                            },
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

      {composerTarget !== null && (
        <WorkflowComposerModal
          existing={composerTarget === "create" ? undefined : composerTarget}
          onClose={() => setComposerTarget(null)}
          onSaved={() => setComposerTarget(null)}
        />
      )}

      {runTarget !== null && (
        <CreateWorkflowRunModal
          initialWorkflow={runTarget}
          onClose={() => setRunTarget(null)}
          onCreated={(runName) => {
            setRunTarget(null);
            history.push(formatPath(DevPaths.workflowRunDetails, { runName }));
          }}
        />
      )}

      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.workflow").toLowerCase(),
          name: deleteTarget,
        })}
        titleIconVariant="warning"
        isOpen={!!deleteTarget}
        message={t("dialog.message.delete")}
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

export default WorkflowsPage;
