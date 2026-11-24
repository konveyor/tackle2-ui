import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { TerminationUsage, UsageBadge, mergeUsage } from "./run-usage";

describe("runtime usage snapshots", () => {
  it("reads cumulative Lightspeed tokens without inventing cost or occupancy", () => {
    const usage = mergeUsage(null, {
      sessionUpdate: "usage_update",
      inputTokens: 40,
      outputTokens: 10,
    });
    expect(usage.inputTokens).toBe(40);
    expect(usage.outputTokens).toBe(10);
    expect(usage.used).toBeUndefined();
    expect(usage.contextLimit).toBeUndefined();
    expect(usage.cost).toBeUndefined();
    expect(usage.summedCost).toBeUndefined();
  });

  it("replaces cumulative snapshots across channels and handoff instead of adding them", () => {
    const primary = mergeUsage(null, {
      sessionUpdate: "usage_update",
      inputTokens: 40,
      outputTokens: 10,
    });
    const duplicate = mergeUsage(primary, {
      sessionUpdate: "usage_update",
      accumulatedInputTokens: 40,
      accumulatedOutputTokens: 10,
    });
    const handoff = mergeUsage(duplicate, {
      sessionUpdate: "usage_update",
      inputTokens: 80,
      outputTokens: 20,
    });
    expect(handoff.inputTokens).toBe(80);
    expect(handoff.outputTokens).toBe(20);
  });

  it("distinguishes absent token counts from measured zero", () => {
    const first = mergeUsage(null, {
      sessionUpdate: "usage_update",
      inputTokens: 40,
    });
    expect(first.outputTokens).toBeUndefined();
    const zero = mergeUsage(first, {
      sessionUpdate: "usage_update",
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(zero.inputTokens).toBe(0);
    expect(zero.outputTokens).toBe(0);
    const missing = mergeUsage(zero, { sessionUpdate: "usage_update" });
    expect(missing.inputTokens).toBe(0);
    expect(missing.outputTokens).toBe(0);
  });

  it("ignores malformed token observations without replacing prior measurements", () => {
    const previous = { inputTokens: 40, outputTokens: 10 };
    const usage = mergeUsage(previous, {
      sessionUpdate: "usage_update",
      inputTokens: -1,
      outputTokens: Number.NaN,
    });
    expect(usage.inputTokens).toBe(40);
    expect(usage.outputTokens).toBe(10);
  });

  it("keeps Goose occupancy and cost behavior, including measured zero cost", () => {
    const usage = mergeUsage(null, {
      sessionUpdate: "usage_update",
      used: 100,
      contextLimit: 200000,
      accumulatedInputTokens: 40,
      accumulatedOutputTokens: 10,
      accumulatedCost: 0,
    });
    expect(usage).toMatchObject({
      used: 100,
      contextLimit: 200000,
      inputTokens: 40,
      outputTokens: 10,
      cost: 0,
    });
    expect(
      mergeUsage(usage, { sessionUpdate: "usage_update", used: 0 }).used
    ).toBe(100);
  });
});

describe("token usage display", () => {
  it("shows a token-only snapshot in the chat header", () => {
    render(<UsageBadge usage={{ inputTokens: 40, outputTokens: 10 }} />);
    expect(screen.getByLabelText("agentic.chat.usage")).toBeVisible();
    expect(screen.getByText("agentic.chat.usageTokens")).toBeVisible();
  });

  it("preserves the harness turn count without requiring a usage snapshot", () => {
    render(<UsageBadge usage={{}} turns={{ turnsUsed: 17, maxTurns: 200 }} />);
    expect(screen.getByLabelText("agentic.chat.usage")).toHaveTextContent(
      "agentic.chat.usageChipTurnOf"
    );
  });

  it("keeps harness turns in the header when token-only usage arrives", () => {
    render(
      <UsageBadge
        usage={{ inputTokens: 40, outputTokens: 10 }}
        turns={{ turnsUsed: 17, maxTurns: 200 }}
      />
    );
    const badge = screen.getByLabelText("agentic.chat.usage");
    expect(badge).toHaveTextContent("agentic.chat.usageChipTurnOf");
    expect(badge).not.toHaveTextContent("agentic.chat.usageTokens");
  });

  it("preserves the existing context badge when occupancy is reported", () => {
    render(
      <UsageBadge
        usage={{
          used: 100,
          contextLimit: 200000,
          inputTokens: 40,
          outputTokens: 10,
        }}
      />
    );
    const badge = screen.getByLabelText("agentic.chat.usage");
    expect(badge).toHaveTextContent("agentic.chat.usageChipContext");
    expect(badge).not.toHaveTextContent("agentic.chat.usageTokens");
  });

  it("shows measured zero and partial token observations", () => {
    render(<UsageBadge usage={{ inputTokens: 0 }} />);
    expect(screen.getByLabelText("agentic.chat.usage")).toBeVisible();
    expect(screen.getByText("agentic.chat.usageInputTokens")).toBeVisible();
    expect(
      screen.queryByText("agentic.chat.usageOutputTokens")
    ).not.toBeInTheDocument();
  });

  it("shows an output-only zero without inventing an input count", () => {
    render(<UsageBadge usage={{ outputTokens: 0 }} />);
    expect(screen.getByText("agentic.chat.usageOutputTokens")).toBeVisible();
    expect(
      screen.queryByText("agentic.chat.usageInputTokens")
    ).not.toBeInTheDocument();
  });

  it("keeps an absent usage snapshot out of the header", () => {
    render(<UsageBadge usage={{}} />);
    expect(
      screen.queryByLabelText("agentic.chat.usage")
    ).not.toBeInTheDocument();
  });

  it("shows harness-reported final tokens without requiring live replay", () => {
    const usage = { turnsUsed: 2, inputTokens: 40, outputTokens: 10 };
    render(<TerminationUsage usage={usage} />);
    expect(screen.getByText(/agentic.chat.usageTokens/)).toBeVisible();
  });
});
