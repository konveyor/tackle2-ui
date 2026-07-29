/**
 * "Load defaults" — POST /agentic/defaults: seeds the managed default set
 * (provider, stage skill cards, domain cards, stage agents, the default
 * playbooks, and the agent-image catalog). Create-only and re-runnable:
 * existing resources are reported, never touched.
 */
import React, { useState } from "react";
import { AxiosError } from "axios";
import { Alert, Button } from "@patternfly/react-core";

import type { SeedResult } from "@app/api/agentic/contract";
import { useLoadDefaultsMutation } from "@app/queries/agent-runs";
import { getAxiosErrorMessage } from "@app/utils/utils";

export const LoadDefaultsButton: React.FC = () => {
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
        Load defaults
      </Button>
      {error && (
        <Alert variant="danger" isInline isPlain title="Load defaults failed">
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
              ? `Seeded ${created.length} resource${
                  created.length === 1 ? "" : "s"
                }` + (existing > 0 ? ` (${existing} already existed)` : "")
              : "All default resources already exist"
          }
        >
          {created.length > 0 &&
            created.map((r) => `${r.kind}/${r.name}`).join(", ")}
        </Alert>
      )}
    </>
  );
};
