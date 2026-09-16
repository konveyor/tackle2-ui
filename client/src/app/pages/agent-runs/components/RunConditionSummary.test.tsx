import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import type {
  Condition,
  HarnessTerminationData,
} from "@app/api/agentic/contract";

import { RunConditionSummary, explanatoryMessage } from "./RunConditionSummary";

const PROVIDER_ERROR =
  "provider error: Ran into this error: Failed to call Bedrock: The security token included in the request is invalid.";

// A failed stage's termination log, which the controller copies into both
// terminationData and the Succeeded=False message.
const failedBlob: HarnessTerminationData = {
  exitCode: 1,
  outcome: "failed",
  stopReason: PROVIDER_ERROR,
  usage: { turnsUsed: 0 },
};

const failed = (message: string): Condition => ({
  type: "Succeeded",
  status: "False",
  reason: "Failed",
  message,
});

describe("explanatoryMessage", () => {
  it("shows a failed run's stopReason instead of the termination JSON", () => {
    expect(
      explanatoryMessage(failed(JSON.stringify(failedBlob)), failedBlob)
    ).toBe(PROVIDER_ERROR);
  });

  it("keeps the JSON message when the termination data has no stopReason", () => {
    const data = { exitCode: 1, outcome: "failed" };
    expect(explanatoryMessage(failed(JSON.stringify(data)), data)).toBe(
      JSON.stringify(data)
    );
  });

  it("keeps the JSON message from a harness with another schema", () => {
    const data = { error: "clone failed" } as unknown as HarnessTerminationData;
    expect(explanatoryMessage(failed('{"error":"clone failed"}'), data)).toBe(
      '{"error":"clone failed"}'
    );
  });

  it("ignores a blank or non-string stopReason", () => {
    expect(
      explanatoryMessage(failed("Agent exited with code 1"), {
        stopReason: "  ",
      })
    ).toBe("Agent exited with code 1");
    const numeric = { stopReason: 42 } as unknown as HarnessTerminationData;
    expect(
      explanatoryMessage(failed("Agent exited with code 1"), numeric)
    ).toBe("Agent exited with code 1");
  });

  it("keeps a plain-text message when there is no termination data", () => {
    expect(explanatoryMessage(failed("source is not a git repository"))).toBe(
      "source is not a git repository"
    );
  });

  it("keeps the controller's LimitReached message", () => {
    const limitReached: Condition = {
      type: "Succeeded",
      status: "False",
      reason: "LimitReached",
      message: "Execution limit reached; the agent committed a handoff",
    };
    expect(
      explanatoryMessage(limitReached, {
        exitCode: 2,
        outcome: "limitReached",
        limitReached: "maxTurns",
        stopReason: "end_turn",
      })
    ).toBe(limitReached.message);
  });

  it("keeps a Ready condition's message", () => {
    const ready: Condition = {
      type: "Ready",
      status: "False",
      reason: "Failed",
      message: "Sandbox finished with reason: Error",
    };
    expect(explanatoryMessage(ready, failedBlob)).toBe(ready.message);
  });

  it("returns undefined without a condition", () => {
    expect(explanatoryMessage(undefined, failedBlob)).toBeUndefined();
  });
});

describe("RunConditionSummary", () => {
  it("shows the stopReason beside a failed run's phase", () => {
    const json = JSON.stringify(failedBlob);
    render(
      <RunConditionSummary
        conditions={[failed(json)]}
        phase="Failed"
        terminationData={failedBlob}
      />
    );
    expect(screen.getByText(PROVIDER_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(json)).not.toBeInTheDocument();
  });

  it("shows the condition message without termination data", () => {
    render(
      <RunConditionSummary
        conditions={[failed("source is not a git repository")]}
        phase="Failed"
      />
    );
    expect(
      screen.getByText("source is not a git repository")
    ).toBeInTheDocument();
  });
});
