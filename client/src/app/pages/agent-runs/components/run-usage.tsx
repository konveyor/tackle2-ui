import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";
import { TachometerAltIcon } from "@patternfly/react-icons";

import type { PlanRungMeta, SessionUpdate } from "@app/api/agentic/acp";
import type { HarnessTerminationData } from "@app/api/agentic/contract";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Runtime-reported usage for the run's session. Cumulative snapshots replace
 * prior snapshots; missing measurements remain unknown.
 */
export interface RunUsage {
  /** Tokens occupying the context window right now. Absent until the
   * provider reports a real figure -- goose on Bedrock only ever says 0,
   * which in the header read as a measurement. */
  used?: number;
  contextLimit?: number;
  /** Accumulated over the session. */
  inputTokens?: number;
  outputTokens?: number;
  /** Accumulated cost as goose reports it (usage_update.accumulatedCost). */
  cost?: number;
  /** Per-response costs summed (message_usage) — the fallback when goose
   * reports no accumulated figure. */
  summedCost?: number;
  currency?: string;
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const tokenCount = (v: unknown): number | undefined => {
  const value = num(v);
  return value !== undefined && value >= 0 ? value : undefined;
};

/**
 * Fold a usage notice into the running counters. goose's custom
 * `usage_update` (customNotifications) carries used / contextLimit /
 * accumulatedInputTokens / accumulatedOutputTokens / accumulatedCost; the
 * standard ACP one it also emits at prompt end carries used / size /
 * cost.{amount,currency}. Lightspeed reports cumulative inputTokens and
 * outputTokens. `message_usage` is one per model response.
 */
export function mergeUsage(prev: RunUsage | null, u: SessionUpdate): RunUsage {
  const base: RunUsage = prev ?? {};
  if (u.sessionUpdate === "message_usage") {
    const usage = isRecord(u.usage) ? u.usage : {};
    const cost = num(usage.cost);
    return {
      ...base,
      summedCost:
        cost === undefined ? base.summedCost : (base.summedCost ?? 0) + cost,
    };
  }
  const cost = isRecord(u.cost) ? u.cost : undefined;
  return {
    ...base,
    // A context that has held a prompt is never empty: 0 is a provider that
    // does not meter occupancy (goose on Bedrock), not a reading.
    used: num(u.used) || base.used,
    contextLimit: num(u.contextLimit) ?? num(u.size) ?? base.contextLimit,
    inputTokens:
      tokenCount(u.inputTokens) ??
      tokenCount(u.accumulatedInputTokens) ??
      base.inputTokens,
    outputTokens:
      tokenCount(u.outputTokens) ??
      tokenCount(u.accumulatedOutputTokens) ??
      base.outputTokens,
    cost: num(u.accumulatedCost) ?? num(cost?.amount) ?? base.cost,
    currency: str(cost?.currency) || base.currency,
  };
}

/** Render only the token measurements the runtime actually supplied. */
function tokenUsageText(
  usage: Pick<RunUsage, "inputTokens" | "outputTokens">,
  t: TFunction
): string | null {
  const input = tokenCount(usage.inputTokens);
  const output = tokenCount(usage.outputTokens);
  if (input !== undefined && output !== undefined) {
    return t("agentic.chat.usageTokens", {
      input: input.toLocaleString(),
      output: output.toLocaleString(),
    });
  }
  if (input !== undefined) {
    return t("agentic.chat.usageInputTokens", {
      input: input.toLocaleString(),
    });
  }
  if (output !== undefined) {
    return t("agentic.chat.usageOutputTokens", {
      output: output.toLocaleString(),
    });
  }
  return null;
}

// ------------------------------------------------------------ usage badge

const compactNumber = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatCost(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: amount < 1 ? 4 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(4)} ${currency ?? ""}`.trim();
  }
}

/**
 * Reported tokens, context occupancy, cost and the harness's turn count.
 * Turns come from the published task rung, never a tally of responses seen
 * by this connection, so late attach and reconnect retain the same count.
 */
export function UsageBadge({
  usage,
  turns,
}: {
  usage: RunUsage;
  turns?: Pick<PlanRungMeta, "turnsUsed" | "maxTurns">;
}) {
  const { t } = useTranslation();
  const cost = usage.cost ?? usage.summedCost;
  const costText = cost === undefined ? null : formatCost(cost, usage.currency);
  const { used, contextLimit } = usage;
  const limitText = contextLimit ? compactNumber.format(contextLimit) : null;
  const turnsText =
    turns?.turnsUsed === undefined
      ? null
      : turns.maxTurns
        ? t("agentic.chat.usageChipTurnOf", {
            turn: turns.turnsUsed,
            max: turns.maxTurns,
          })
        : t("agentic.chat.usageChipTurn", { turn: turns.turnsUsed });
  const contextText =
    used === undefined
      ? limitText && t("agentic.chat.usageChipLimit", { limit: limitText })
      : limitText
        ? t("agentic.chat.usageChipContext", {
            used: compactNumber.format(used),
            limit: limitText,
          })
        : t("agentic.chat.usageChipUsed", { used: compactNumber.format(used) });
  const tokenText = tokenUsageText(usage, t);
  const parts = [turnsText, contextText, costText].filter(Boolean);
  const badgeText = parts.length > 0 ? parts.join(" · ") : tokenText;
  if (!badgeText) return null;
  return (
    <Tooltip
      content={
        <div>
          {turns?.turnsUsed !== undefined && (
            <div>
              {turns.maxTurns
                ? t("agentic.chat.usageTurnsOf", {
                    turn: turns.turnsUsed,
                    max: turns.maxTurns,
                  })
                : t("agentic.chat.usageTurns", { turn: turns.turnsUsed })}
            </div>
          )}
          <div>
            {used === undefined
              ? contextLimit
                ? t("agentic.chat.usageContextUnreported", {
                    limit: contextLimit.toLocaleString(),
                  })
                : null
              : contextLimit
                ? t("agentic.chat.usageContext", {
                    used: used.toLocaleString(),
                    limit: contextLimit.toLocaleString(),
                    percent: Math.round((used / contextLimit) * 100),
                  })
                : t("agentic.chat.usageContextUnbounded", {
                    used: used.toLocaleString(),
                  })}
          </div>
          {tokenText && <div>{tokenText}</div>}
          {costText && (
            <div>{t("agentic.chat.usageCost", { amount: costText })}</div>
          )}
        </div>
      }
    >
      <Label
        isCompact
        variant="outline"
        icon={<TachometerAltIcon />}
        aria-label={t("agentic.chat.usage")}
      >
        {badgeText}
      </Label>
    </Tooltip>
  );
}

// ---------------------------------------------------------- finished run

/**
 * Usage the harness reports spending before the run ended --
 * the measure of whether the agent did any work before it failed.
 */
export function TerminationUsage({
  usage,
}: {
  usage?: HarnessTerminationData["usage"];
}) {
  const { t } = useTranslation();
  const turns = usage?.turnsUsed;
  const used = usage?.contextUsed;
  const size = usage?.contextSize;
  const parts = [
    typeof turns === "number"
      ? t("agentic.chat.failureUsageTurns", { count: turns })
      : null,
    tokenUsageText(usage ?? {}, t),
    typeof used !== "number"
      ? null
      : size
        ? t("agentic.chat.usageContext", {
            used: used.toLocaleString(),
            limit: size.toLocaleString(),
            percent: Math.round((used / size) * 100),
          })
        : t("agentic.chat.usageContextUnbounded", {
            used: used.toLocaleString(),
          }),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <div className="chat-meta">{parts.join(" · ")}</div>;
}
