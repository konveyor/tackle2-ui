import React from "react";
import { AxiosError } from "axios";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Alert,
  Bullseye,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Label,
  PageSection,
  Spinner,
} from "@patternfly/react-core";

import type { AgentRunDetailsRoute } from "@app/Paths";
import { DevPaths } from "@app/Paths";
import { isTerminalPhase, runHubCoordinates } from "@app/api/agentic/contract";
import { PageHeader } from "@app/components/PageHeader";
import { StateError } from "@app/components/StateError";
import { useFetchAgentRun } from "@app/queries/agent-runs";
import { useFetchAgenticApplications } from "@app/queries/agentic-catalog";
import { formatAge, formatDuration } from "@app/utils/agentic";

import { BranchPanel, repoBranchUrl } from "./components/BranchPanel";
import { ChatPanel } from "./components/ChatPanel";
import { PhaseLabel } from "./components/PhaseLabel";

import "./agent-runs.css";

const AgentRunDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { runName } = useParams<AgentRunDetailsRoute>();
  const { agentRun, isLoading, fetchError } = useFetchAgentRun(runName);
  // Inventory failures leave `application` undefined — BranchPanel copes.
  const { applications } = useFetchAgenticApplications();

  const breadcrumbs = [
    { title: t("terms.agentRuns"), path: DevPaths.agentRuns },
    { title: runName },
  ];

  if (isLoading && !agentRun) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label={t("agentic.runDetail.loadingAriaLabel")} />
        </Bullseye>
      </PageSection>
    );
  }

  if (!agentRun) {
    const isNotFound =
      !fetchError ||
      (fetchError instanceof AxiosError && fetchError.response?.status === 404);
    return (
      <>
        <PageSection hasBodyWrapper={false}>
          <PageHeader title={runName} breadcrumbs={breadcrumbs} />
        </PageSection>
        <PageSection>
          {isNotFound ? (
            <Alert
              variant="warning"
              isInline
              title={t("agentic.runDetail.notFoundTitle")}
            >
              <Trans
                i18nKey="agentic.runDetail.notFoundMessage"
                values={{ runName }}
              />
            </Alert>
          ) : (
            <StateError />
          )}
        </PageSection>
      </>
    );
  }

  const coordinates = runHubCoordinates(agentRun.spec.env);
  const application = applications.find((a) => a.id === coordinates.appId);
  const instructions = agentRun.spec.instructions;
  const params = agentRun.spec.params ?? [];
  const models = agentRun.spec.models ?? [];
  // The run's own repository param is the repo it actually cloned; the
  // application record can be repointed after the fact.
  const runRepoUrl =
    params.find((p) => p.name === "repository")?.value ??
    application?.repository?.url;
  const targetBranchUrl = coordinates.targetBranch
    ? repoBranchUrl(runRepoUrl, coordinates.targetBranch)
    : undefined;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <PageHeader
          title={runName}
          breadcrumbs={breadcrumbs}
          description={<PhaseLabel phase={agentRun.status?.phase} />}
        />
        {fetchError && (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.runDetail.refreshError")}
            style={{ marginTop: "0.5rem" }}
          >
            {fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)}
          </Alert>
        )}
        <DescriptionList
          isHorizontal
          isCompact
          columnModifier={{ default: "2Col" }}
          style={{ marginTop: "1rem" }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.agent")}</DescriptionListTerm>
            <DescriptionListDescription>
              {agentRun.spec.agentRef}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.sandbox")}</DescriptionListTerm>
            <DescriptionListDescription>
              {agentRun.status?.sandboxName ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.age")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatAge(agentRun.metadata.creationTimestamp)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.duration")}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDuration(agentRun.status?.duration)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>

        <Content>
          <Content component="h3" style={{ marginTop: "1rem" }}>
            {t("agentic.runDetail.runSpec")}
          </Content>
        </Content>
        <DescriptionList isHorizontal isCompact style={{ marginTop: "0.5rem" }}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.instructions")}</DescriptionListTerm>
            <DescriptionListDescription>
              {!instructions ? (
                "-"
              ) : instructions.length > 120 ? (
                <ExpandableSection toggleText={t("terms.instructions")}>
                  {instructions}
                </ExpandableSection>
              ) : (
                instructions
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.parameters")}</DescriptionListTerm>
            <DescriptionListDescription>
              {params.length === 0
                ? "-"
                : params.map((p) => (
                    <Label
                      key={p.name}
                      isCompact
                      variant="outline"
                      style={{ marginRight: "0.5rem" }}
                    >
                      <code>
                        {p.name}={p.value}
                      </code>
                    </Label>
                  ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.runDetail.models")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {models.length === 0
                ? "-"
                : models.map((m) => (
                    <div key={m.role}>
                      {m.role}: {m.provider} / {m.model}
                    </div>
                  ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.runDetail.applicationId")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.appId ?? "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.runDetail.hubBaseUrl")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.hubBaseUrl ? (
                <code>{coordinates.hubBaseUrl}</code>
              ) : (
                "-"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {t("agentic.runDetail.hubToken")}
            </DescriptionListTerm>
            <DescriptionListDescription>
              {coordinates.hasToken ? t("agentic.runDetail.tokenSet") : "-"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t("terms.targetBranch")}</DescriptionListTerm>
            <DescriptionListDescription>
              {!coordinates.targetBranch ? (
                "-"
              ) : targetBranchUrl ? (
                <a href={targetBranchUrl} target="_blank" rel="noreferrer">
                  <code>{coordinates.targetBranch}</code>
                </a>
              ) : (
                <code>{coordinates.targetBranch}</code>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>

        {coordinates.targetBranch && (
          <BranchPanel
            application={application}
            repoUrl={runRepoUrl}
            targetBranch={coordinates.targetBranch}
            isTerminal={isTerminalPhase(agentRun.status?.phase)}
          />
        )}
      </PageSection>
      <PageSection
        isFilled
        className="run-detail-chat-section"
        padding={{ default: "padding" }}
      >
        <ChatPanel
          runName={runName}
          agentRef={agentRun.spec.agentRef}
          targetBranch={coordinates.targetBranch}
          targetBranchUrl={targetBranchUrl}
        />
      </PageSection>
    </>
  );
};

export default AgentRunDetailPage;
