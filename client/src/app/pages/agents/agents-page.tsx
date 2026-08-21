import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Tooltip,
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

import type { AgentResource } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { useNotifications } from "@app/components/NotificationsContext";
import { StateError } from "@app/components/StateError";
import {
  ReadyLabel,
  skillCount,
} from "@app/pages/agent-runs/components/ReadyLabel";
import { useDeleteAgentMutation, useFetchAgents } from "@app/queries/agents";
import { formatAge } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { AgentDesignerModal } from "./components/AgentDesignerModal";

const AgentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = useNotifications();
  const { agents, isLoading, fetchError, refetch } = useFetchAgents();
  const [designerTarget, setDesignerTarget] = useState<
    AgentResource | "create" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const deleteAgentMutation = useDeleteAgentMutation(
    (name) => {
      setDeleteTarget(null);
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: name,
          type: t("terms.agent"),
        }),
        variant: "success",
      });
    },
    (err) => {
      setDeleteTarget(null);
      pushNotification({ title: getAxiosErrorMessage(err), variant: "danger" });
    }
  );

  const sortedAgents = [...agents].sort((a, b) => {
    const ta = a.metadata.creationTimestamp ?? "";
    const tb = b.metadata.creationTimestamp ?? "";
    return tb.localeCompare(ta);
  });

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.agents")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && agents.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={() => setDesignerTarget("create")}
                >
                  {t("agentic.agents.createAgent")}
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {fetchError ? (
            <StateError />
          ) : sortedAgents.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText={t("agentic.agents.noAgentsTitle")}
            >
              <EmptyStateBody>
                {t("agentic.agents.noAgentsBody")}
              </EmptyStateBody>
              <EmptyStateBody>{t("agentic.emptyStateSeedHint")}</EmptyStateBody>
              <Button
                variant="primary"
                onClick={() => setDesignerTarget("create")}
              >
                {t("agentic.agents.createAgent")}
              </Button>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.agents")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.image")}</Th>
                  <Th>{t("agentic.agents.gateways")}</Th>
                  <Th>{t("terms.skills")}</Th>
                  <Th>{t("agentic.agents.params")}</Th>
                  <Th>{t("agentic.agents.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                  <Th screenReaderText={t("actions.rowActions")} />
                </Tr>
              </Thead>
              <Tbody>
                {sortedAgents.map((agent: AgentResource) => {
                  const name = agent.metadata.name ?? "";
                  const skills = skillCount(agent.spec);
                  // Hover detail for the count: card refs, then collections.
                  const skillRefs = [
                    ...(agent.spec.skillCards?.map((s) => s.ref) ?? []),
                    ...(agent.spec.skillCollections?.map(
                      (s) =>
                        `${t("terms.skillCollection").toLowerCase()}: ${s.ref}`
                    ) ?? []),
                  ];
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.image")}>{agent.spec.image}</Td>
                      <Td dataLabel={t("agentic.agents.gateways")}>
                        {agent.spec.gateways?.map((g) => g.ref).join(", ") ||
                          "-"}
                      </Td>
                      <Td dataLabel={t("terms.skills")}>
                        {skillRefs.length === 0 ? (
                          skills
                        ) : (
                          <Tooltip
                            content={
                              <div>
                                {skillRefs.map((r) => (
                                  <div key={r}>{r}</div>
                                ))}
                              </div>
                            }
                          >
                            <span>{skills}</span>
                          </Tooltip>
                        )}
                      </Td>
                      <Td dataLabel={t("agentic.agents.params")}>
                        {agent.spec.params?.length ?? 0}
                      </Td>
                      <Td dataLabel={t("agentic.agents.ready")}>
                        <ReadyLabel conditions={agent.status?.conditions} />
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(agent.metadata.creationTimestamp)}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => setDesignerTarget(agent),
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

      {designerTarget && (
        <AgentDesignerModal
          existing={designerTarget === "create" ? undefined : designerTarget}
          onClose={() => setDesignerTarget(null)}
          onSaved={() => {
            setDesignerTarget(null);
            refetch();
          }}
        />
      )}

      <ConfirmDialog
        title={t("dialog.title.deleteWithName", {
          what: t("terms.agent").toLowerCase(),
          name: deleteTarget,
        })}
        titleIconVariant="warning"
        isOpen={!!deleteTarget}
        message={t("dialog.message.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        confirmBtnLabel={t("actions.delete")}
        cancelBtnLabel={t("actions.cancel")}
        inProgress={deleteAgentMutation.isLoading}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAgentMutation.mutate(deleteTarget);
        }}
      />
    </>
  );
};

export default AgentsPage;
