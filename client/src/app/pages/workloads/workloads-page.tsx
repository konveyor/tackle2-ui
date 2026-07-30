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
import type { AgentWorkload } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import { LoadDefaultsButton } from "@app/pages/agent-runs/components/LoadDefaultsButton";
import { ReadyLabel } from "@app/pages/agent-runs/components/ReadyLabel";
import { CreateWorkloadRunModal } from "@app/pages/workload-runs/components/CreateWorkloadRunModal";
import {
  useDeleteWorkloadMutation,
  useFetchWorkloads,
} from "@app/queries/workloads";
import { formatAge } from "@app/utils/agentic";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { WorkloadComposerModal } from "./components/WorkloadComposerModal";

function stagesSummary(workload: AgentWorkload): string | null {
  const stages = workload.spec.stages ?? [];
  if (stages.length === 0) return null;
  const names = stages.map((s) => s.name);
  return `${stages.length}: ${names.join(" → ")}`;
}

const WorkloadsPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { pushNotification } = useNotifications();
  const { workloads, isLoading, fetchError } = useFetchWorkloads();
  const [composerTarget, setComposerTarget] = useState<
    AgentWorkload | "create" | null
  >(null);
  const [runTarget, setRunTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deleteMutation = useDeleteWorkloadMutation(
    (name) => {
      setDeleteTarget(null);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.workload"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const sortedWorkloads = [...workloads].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.workloads")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && workloads.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={() => setComposerTarget("create")}
                >
                  {t("agentic.workloads.createWorkload")}
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <LoadDefaultsButton />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {fetchError ? (
            <StateError />
          ) : sortedWorkloads.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText={t("agentic.workloads.emptyTitle")}
            >
              <EmptyStateBody>
                {t("agentic.workloads.emptyBody")}
              </EmptyStateBody>
              <Button
                variant="primary"
                onClick={() => setComposerTarget("create")}
              >
                {t("agentic.workloads.createWorkload")}
              </Button>{" "}
              <LoadDefaultsButton />
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.workloads")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.stages")}</Th>
                  <Th>{t("agentic.workloads.guide")}</Th>
                  <Th>{t("agentic.workloads.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedWorkloads.map((pb: AgentWorkload) => {
                  const name = pb.metadata.name ?? "";
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.stages")}>
                        {stagesSummary(pb) ?? t("agentic.workloads.zeroStages")}
                      </Td>
                      <Td dataLabel={t("agentic.workloads.guide")}>
                        {pb.spec.guide ? (
                          <Truncate content={pb.spec.guide} />
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td dataLabel={t("agentic.workloads.ready")}>
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
        <WorkloadComposerModal
          existing={composerTarget === "create" ? undefined : composerTarget}
          onClose={() => setComposerTarget(null)}
          onSaved={() => setComposerTarget(null)}
        />
      )}

      {runTarget !== null && (
        <CreateWorkloadRunModal
          initialWorkload={runTarget}
          onClose={() => setRunTarget(null)}
          onCreated={(runName) => {
            setRunTarget(null);
            history.push(formatPath(DevPaths.workloadRunDetails, { runName }));
          }}
        />
      )}

      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.workload").toLowerCase(),
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

export default WorkloadsPage;
