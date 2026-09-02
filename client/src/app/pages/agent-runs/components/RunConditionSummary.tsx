import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";

import type { Condition } from "@app/api/agentic/contract";

const SUCCEEDED_CONDITION = "Succeeded";
const READY_CONDITION = "Ready";

/**
 * Reasons that describe healthy progress rather than a problem: a run
 * in flight carries Ready=False/Running (or StageRunning on a workflow
 * run) by design, and a finished one Ready=True/Succeeded.
 */
const PROGRESS_REASONS = new Set([
  "Running",
  "SandboxCreated",
  "StageRunning",
  "Succeeded",
  "StageSucceeded",
]);

/**
 * The condition that explains why a run is where it is, when that is worth
 * saying. `Succeeded` once agentic-controller#119 lands (the Job-style
 * terminal signal, whose reasons include LimitReached); `Ready` today —
 * the controller parks every failure on Ready=False with the reason:
 * AgentNotFound, AgentNotReady, InvalidParams, InvalidGateway,
 * SandboxCreationFailed, SandboxNotFound, Failed ("Sandbox finished with
 * reason: …"); workflow runs add WorkflowNotFound, WorkflowNotReady,
 * StageNotFound, AgentRunCreationFailed, AgentRunDeleted, StageFailed.
 */
export function explanatoryCondition(
  conditions?: Condition[]
): Condition | undefined {
  const succeeded = conditions?.find((c) => c.type === SUCCEEDED_CONDITION);
  const ready = conditions?.find((c) => c.type === READY_CONDITION);
  const condition = succeeded ?? ready;
  if (!condition || condition.status === "True") return undefined;
  if (!condition.reason || PROGRESS_REASONS.has(condition.reason)) {
    return undefined;
  }
  return condition;
}

/**
 * Reason + message beside a run's phase. Renders nothing while the run
 * is progressing normally, so the phase label alone is the healthy state;
 * a reason that merely repeats the phase ("Failed" next to Failed) is
 * left out and only its message is shown.
 */
export function RunConditionSummary({
  conditions,
  phase,
}: {
  conditions?: Condition[];
  /** The phase shown beside this summary, so the reason can skip echoing it. */
  phase?: string;
}) {
  const { t } = useTranslation();
  const condition = explanatoryCondition(conditions);
  if (!condition) return null;
  const showReason = !!condition.reason && condition.reason !== phase;
  if (!showReason && !condition.message) return null;
  const since = condition.lastTransitionTime
    ? t("agentic.runDetail.conditionSince", {
        time: new Date(condition.lastTransitionTime).toLocaleString(),
      })
    : "";
  return (
    <span className="run-condition-summary">
      {showReason && (
        <Tooltip
          content={t("agentic.runDetail.conditionTooltip", {
            type: condition.type,
            status: condition.status,
            since,
          })}
        >
          <Label
            isCompact
            color={condition.status === "False" ? "red" : "orange"}
          >
            {condition.reason}
          </Label>
        </Tooltip>
      )}
      {condition.message && (
        <span className="run-condition-message">{condition.message}</span>
      )}
    </span>
  );
}
