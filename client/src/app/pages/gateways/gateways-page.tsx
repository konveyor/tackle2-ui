import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Alert,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  PageSection,
  Tooltip,
} from "@patternfly/react-core";
import { CubesIcon, ExclamationTriangleIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { Gateway } from "@app/api/agentic/contract";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";
import {
  ReadyLabel,
  readyCondition,
} from "@app/pages/agent-runs/components/ReadyLabel";
import { useFetchGateways } from "@app/queries/agentic-catalog";
import { formatAge } from "@app/utils/agentic";

import "./gateways.css";

/**
 * Providers whose native API has no OpenAI-shaped `GET /v1/models`: the
 * controller's verification Job probes exactly that, so for these the
 * Gateway parks at Ready=False / ConnectionFailed for good and every Agent
 * referencing it stays DependenciesNotReady (agentic-controller#167).
 * Named here so the hold reads as what it is instead of a bare "Not Ready".
 */
const UNVERIFIABLE_PROVIDERS = new Set(["aws-bedrock", "gcp-vertex-ai"]);

const UNVERIFIABLE_ISSUE_URL =
  "https://github.com/konveyor/agentic-controller/issues/167";

export function isUnverifiableProvider(provider: string | undefined): boolean {
  return !!provider && UNVERIFIABLE_PROVIDERS.has(provider.toLowerCase());
}

/** Ready=False on a provider the controller cannot verify — the #167 hold. */
export function isHeldByVerification(gateway: Gateway): boolean {
  const ready = readyCondition(gateway.status?.conditions);
  return (
    isUnverifiableProvider(gateway.spec.provider) &&
    ready !== undefined &&
    ready.status !== "True"
  );
}

const GatewaysPage: React.FC = () => {
  const { t } = useTranslation();
  const { gateways, isLoading, fetchError } = useFetchGateways();

  const sorted = [...gateways].sort((a, b) =>
    (a.metadata.name ?? "").localeCompare(b.metadata.name ?? "")
  );
  const held = sorted.filter(isHeldByVerification);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">{t("terms.gateways")}</Content>
          <Content component="p">{t("agentic.gateways.description")}</Content>
        </Content>
      </PageSection>
      <PageSection>
        <ConditionalRender
          when={isLoading && gateways.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          {held.length > 0 && (
            <Alert
              variant="warning"
              isInline
              title={t("agentic.gateways.unverifiableAlertTitle", {
                count: held.length,
                names: held.map((g) => g.metadata.name).join(", "),
              })}
              style={{ marginBottom: "1rem" }}
            >
              <Trans
                i18nKey="agentic.gateways.unverifiableAlertBody"
                components={{
                  issue: (
                    <a
                      href={UNVERIFIABLE_ISSUE_URL}
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </Alert>
          )}

          {fetchError ? (
            <StateError />
          ) : sorted.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText={t("agentic.gateways.emptyTitle")}
            >
              <EmptyStateBody>{t("agentic.gateways.emptyBody")}</EmptyStateBody>
              <EmptyStateBody>{t("agentic.emptyStateSeedHint")}</EmptyStateBody>
            </EmptyState>
          ) : (
            <Table aria-label={t("terms.gateways")} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.provider")}</Th>
                  <Th>{t("terms.model")}</Th>
                  <Th>{t("agentic.gateways.endpoint")}</Th>
                  <Th>{t("agentic.gateways.contextWindow")}</Th>
                  <Th>{t("agentic.gateways.credential")}</Th>
                  <Th>{t("agentic.gateways.ready")}</Th>
                  <Th>{t("terms.age")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sorted.map((gateway: Gateway) => {
                  const name = gateway.metadata.name ?? "";
                  const { provider, endpoint, credentialRef, model } =
                    gateway.spec;
                  const ready = readyCondition(gateway.status?.conditions);
                  const heldByVerification = isHeldByVerification(gateway);
                  return (
                    <Tr key={name}>
                      <Td dataLabel={t("terms.name")}>{name}</Td>
                      <Td dataLabel={t("terms.provider")}>{provider}</Td>
                      <Td dataLabel={t("terms.model")}>
                        {model?.name ?? "-"}
                        {model?.tier && (
                          <>
                            {" "}
                            <Label isCompact variant="outline">
                              {model.tier}
                            </Label>
                          </>
                        )}
                      </Td>
                      <Td dataLabel={t("agentic.gateways.endpoint")}>
                        <code>{endpoint}</code>
                      </Td>
                      <Td dataLabel={t("agentic.gateways.contextWindow")}>
                        {model?.contextWindow
                          ? model.contextWindow.toLocaleString()
                          : "-"}
                      </Td>
                      <Td dataLabel={t("agentic.gateways.credential")}>
                        <code>
                          {credentialRef?.secretName ?? "-"}
                          {credentialRef?.key ? `/${credentialRef.key}` : ""}
                        </code>
                      </Td>
                      <Td dataLabel={t("agentic.gateways.ready")}>
                        <span className="gateway-ready-cell">
                          <ReadyLabel conditions={gateway.status?.conditions} />
                          {heldByVerification && (
                            <Tooltip
                              content={t(
                                "agentic.gateways.unverifiableProviderTooltip",
                                { provider, reason: ready?.reason ?? "" }
                              )}
                            >
                              <Label
                                isCompact
                                color="orange"
                                icon={<ExclamationTriangleIcon />}
                              >
                                {t("agentic.gateways.unverifiableProvider")}
                              </Label>
                            </Tooltip>
                          )}
                        </span>
                      </Td>
                      <Td dataLabel={t("terms.age")}>
                        {formatAge(gateway.metadata.creationTimestamp)}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default GatewaysPage;
