import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

import type {
  Condition,
  HarnessTerminationData,
} from "@app/api/agentic/contract";
import { unwrapStopReason } from "@app/pages/agent-runs/runOutcome";

const SUCCEEDED_CONDITION = "Succeeded";
const READY_CONDITION = "Ready";
const FAILED_REASON = "Failed";

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
 * The message to show for the explanatory condition. When a run fails
 * (Succeeded=False, reason Failed) the controller copies the agent
 * container's whole termination message into the condition, and the
 * Konveyor harness writes that as JSON (agentic-controller#189) whose
 * `stopReason` is the readable part. Every other message is shown as is:
 * plain text (agentic-controller#143), the controller's own LimitReached
 * text, or JSON from a harness with a different schema.
 */
export function explanatoryMessage(
  condition?: Condition,
  terminationData?: HarnessTerminationData
): string | undefined {
  const stopReason = terminationData?.stopReason;
  if (
    condition?.type === SUCCEEDED_CONDITION &&
    condition.status === "False" &&
    condition.reason === FAILED_REASON &&
    typeof stopReason === "string" &&
    stopReason.trim() !== ""
  ) {
    return stopReason;
  }
  // The controller may have copied a termination log the console has no
  // `terminationData` for (an older controller, or a list row): dig the
  // stop reason out rather than showing the viewer raw JSON.
  return unwrapStopReason(condition?.message) ?? condition?.message;
}

/**
 * Reason + message beside a run's phase. Renders nothing while the run
 * is progressing normally, so the phase label alone is the healthy state;
 * a reason that merely repeats the phase ("Failed" next to Failed) is
 * left out and the label carries the message instead -- dropping the label
 * with the reason left a failure as unstyled inline text, which reads as
 * "Failed, no reason given" (konveyor/tackle2-ui#3614).
 */
export function RunConditionSummary({
  conditions,
  phase,
  terminationData,
}: {
  conditions?: Condition[];
  /** The phase shown beside this summary, so the reason can skip echoing it. */
  phase?: string;
  /** An AgentRun's `status.terminationData`, for a failed run's stop reason. */
  terminationData?: HarnessTerminationData;
}) {
  const { t } = useTranslation();
  const condition = explanatoryCondition(conditions);
  if (!condition) return null;
  const message = explanatoryMessage(condition, terminationData);
  const showReason = !!condition.reason && condition.reason !== phase;
  if (!showReason && !message) return null;
  const failed = condition.status === "False";
  const icon = failed ? <ExclamationCircleIcon /> : undefined;
  const color = failed ? "red" : "orange";
  const since = condition.lastTransitionTime
    ? t("agentic.runDetail.conditionSince", {
        time: new Date(condition.lastTransitionTime).toLocaleString(),
      })
    : "";
  return (
    <span className="run-condition-summary">
      {showReason ? (
        <Tooltip
          content={t("agentic.runDetail.conditionTooltip", {
            type: condition.type,
            status: condition.status,
            since,
          })}
        >
          <Label isCompact color={color} icon={icon}>
            {condition.reason}
          </Label>
        </Tooltip>
      ) : (
        // The reason only echoes the phase, so the message carries the
        // label: unstyled, it read as no reason at all. PF shows the whole
        // text in a tooltip of its own once it truncates.
        <Label isCompact color={color} icon={icon} textMaxWidth="60ch">
          {message}
        </Label>
      )}
      {showReason && message && (
        <span className="run-condition-message">{message}</span>
      )}
    </span>
  );
}
