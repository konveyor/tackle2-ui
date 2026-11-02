import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";

import type { Condition } from "@app/api/agentic/contract";
import type { VerifiedState } from "@app/pages/agent-runs/runOutcome";
import { verifiedVerdict } from "@app/pages/agent-runs/runOutcome";

/**
 * The run's verification verdict, beside its phase.
 *
 * A phase says the run completed; it cannot say the tree it pushed holds
 * up, because the harness exits 0 whenever the agent ends its turn
 * normally. This is the harness's own measurement of that tree
 * (agentic-controller#300/#302) and is read on its own condition, so a
 * run can show Succeeded and "Verification failed" at once — which is
 * exactly the case that prompted it.
 */
const LABEL: Record<
  VerifiedState,
  { color: "green" | "red" | "orange" | "grey"; key: string }
> = {
  passed: { color: "green", key: "agentic.verified.passed" },
  failed: { color: "red", key: "agentic.verified.failed" },
  notRun: { color: "orange", key: "agentic.verified.notRun" },
  notReported: { color: "grey", key: "agentic.verified.notReported" },
};

export const VerifiedLabel: React.FC<{
  conditions?: Condition[];
  /**
   * Whether to show the `notReported` state. The run list leaves it out:
   * until a cluster runs a harness that measures, every row would carry
   * the same grey chip, and an absent claim of verification is already
   * honest there. A detail page shows it, because that is where someone
   * goes to find out whether the tree was checked, and "nobody told us"
   * is the answer they need.
   */
  showNotReported?: boolean;
}> = ({ conditions, showNotReported = false }) => {
  const { t } = useTranslation();
  const verdict = verifiedVerdict(conditions);

  if (!verdict) return null;
  if (verdict.state === "notReported" && !showNotReported) return null;

  const { color, key } = LABEL[verdict.state];
  const label = <Label color={color}>{t(key)}</Label>;

  return verdict.message ? (
    <Tooltip content={verdict.message}>{label}</Tooltip>
  ) : (
    label
  );
};
