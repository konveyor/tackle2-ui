import type { HarnessTerminationData } from "@app/api/agentic/contract";

/**
 * ACP stop reasons that only say how the agent's last turn ended, not that
 * anything went wrong. A run that stops on one of these has no failure to
 * report, so they never reach the viewer as a reason.
 */
const BENIGN_STOP_REASONS = new Set([
  "end_turn",
  "max_tokens",
  "max_turn_requests",
  "refusal",
  "cancelled",
]);

/**
 * The harness's `stopReason` when it explains a failure, or undefined when
 * it only records how the turn ended (see BENIGN_STOP_REASONS).
 */
export function failureStopReason(
  terminationData?: HarnessTerminationData
): string | undefined {
  const stopReason = terminationData?.stopReason;
  if (typeof stopReason !== "string") return undefined;
  const text = stopReason.trim();
  if (!text || BENIGN_STOP_REASONS.has(text)) return undefined;
  return text;
}

/**
 * The readable part of a termination message. The controller copies the
 * agent container's whole termination log into the Succeeded condition, and
 * the Konveyor harness writes that as JSON (agentic-controller#189) — whose
 * `stopReason` is the only sentence worth showing. Returns undefined for
 * anything that is not such a JSON object, so callers keep their own text.
 */
export function unwrapStopReason(message?: string): string | undefined {
  if (typeof message !== "string") return undefined;
  const text = message.trim();
  if (!text.startsWith("{") || !text.endsWith("}")) return undefined;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const stopReason = (parsed as HarnessTerminationData).stopReason;
    return typeof stopReason === "string" && stopReason.trim()
      ? stopReason.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Markers of a run that did its work and then could not write to the
 * repository: today go-git's own wording, reached through the harness's
 * "final push: …" reason; `git write access:` is the stable prefix the
 * harness is to put in front of it (konveyor/agentic-controller#247).
 * Either one identifies the failure, so this keeps working once it lands.
 */
const GIT_WRITE_ACCESS_MARKERS = [
  "git write access:",
  "authentication required",
  "no anonymous write access",
];

/**
 * True when a terminal run's reason is the repository refusing the agent's
 * push — the one failure whose fix is a credential rather than a retry.
 * Exported for any page that needs to say so (the run page says it after
 * the fact; the create-run modal can warn before, konveyor/tackle2-ui#3616).
 */
export function isGitWriteAccessFailure(reason?: string): boolean {
  if (typeof reason !== "string") return false;
  const text = reason.toLowerCase();
  return GIT_WRITE_ACCESS_MARKERS.some((marker) => text.includes(marker));
}
