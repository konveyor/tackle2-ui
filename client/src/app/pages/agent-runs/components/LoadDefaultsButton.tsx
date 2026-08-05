/**
 * "Load defaults" — POST /agentic/defaults: seeds the managed default set
 * (gateway, stage skill cards, domain cards, stage agents, the default
 * workflows, and the agent-image catalog). Create-only and re-runnable:
 * existing resources are reported, never touched.
 */
import React, { useState } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Alert, Button } from "@patternfly/react-core";

import type { SeedResult } from "@app/api/agentic/contract";
import { useLoadDefaultsMutation } from "@app/queries/agentic-catalog";
import { getAxiosErrorMessage } from "@app/utils/utils";

export const LoadDefaultsButton: React.FC = () => {
  const { t } = useTranslation();
  const [results, setResults] = useState<SeedResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDefaultsMutation = useLoadDefaultsMutation(
    (seedResults: SeedResult[]) => {
      setResults(seedResults);
      setError(null);
    },
    (err: AxiosError) => {
      setResults(null);
      setError(getAxiosErrorMessage(err));
    }
  );

  const created = results?.filter((r) => r.status === "created") ?? [];
  const existing = (results?.length ?? 0) - created.length;

  return (
    <>
      <Button
        variant="secondary"
        isLoading={loadDefaultsMutation.isLoading}
        isDisabled={loadDefaultsMutation.isLoading}
        onClick={() => loadDefaultsMutation.mutate()}
      >
        {t("agentic.agentRuns.loadDefaults")}
      </Button>
      {error && (
        <Alert
          variant="danger"
          isInline
          isPlain
          title={t("agentic.agentRuns.loadDefaultsFailed")}
        >
          {error}
        </Alert>
      )}
      {results && (
        <Alert
          variant={created.length > 0 ? "success" : "info"}
          isInline
          isPlain
          title={
            created.length > 0
              ? t("agentic.agentRuns.seededCount", { count: created.length }) +
                (existing > 0
                  ? ` ${t("agentic.agentRuns.alreadyExisted", {
                      count: existing,
                    })}`
                  : "")
              : t("agentic.agentRuns.allDefaultsExist")
          }
        >
          {created.length > 0 &&
            created.map((r) => `${r.kind}/${r.name}`).join(", ")}
        </Alert>
      )}
    </>
  );
};
