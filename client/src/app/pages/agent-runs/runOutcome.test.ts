import {
  failureStopReason,
  isGitWriteAccessFailure,
  unwrapStopReason,
} from "./runOutcome";

const PUSH_FAILURE =
  "final push: push konveyor/migration-1790082780: authentication required: No anonymous write access.";

describe("failureStopReason", () => {
  it("keeps a reason that explains a failure", () => {
    expect(failureStopReason({ stopReason: PUSH_FAILURE })).toBe(PUSH_FAILURE);
  });

  it("drops the stop reasons that only say how the turn ended", () => {
    expect(failureStopReason({ stopReason: "end_turn" })).toBeUndefined();
    expect(failureStopReason({ stopReason: " cancelled " })).toBeUndefined();
  });

  it("drops a blank, missing or non-string reason", () => {
    expect(failureStopReason(undefined)).toBeUndefined();
    expect(failureStopReason({ stopReason: "  " })).toBeUndefined();
    expect(
      failureStopReason({ stopReason: 42 } as unknown as {
        stopReason?: string;
      })
    ).toBeUndefined();
  });
});

describe("unwrapStopReason", () => {
  it("digs the stop reason out of a termination log", () => {
    const message = JSON.stringify({
      exitCode: 1,
      outcome: "failed",
      stopReason: PUSH_FAILURE,
    });
    expect(unwrapStopReason(message)).toBe(PUSH_FAILURE);
  });

  it("leaves plain text, other JSON and malformed JSON alone", () => {
    expect(unwrapStopReason("Agent exited with code 1")).toBeUndefined();
    expect(unwrapStopReason('{"error":"clone failed"}')).toBeUndefined();
    expect(unwrapStopReason('{"stopReason":')).toBeUndefined();
    expect(unwrapStopReason(undefined)).toBeUndefined();
  });
});

describe("isGitWriteAccessFailure", () => {
  it("recognises today's go-git wording", () => {
    expect(isGitWriteAccessFailure(PUSH_FAILURE)).toBe(true);
    expect(
      isGitWriteAccessFailure("final push: ...: authentication required")
    ).toBe(true);
  });

  it("recognises the stable prefix the harness is to add", () => {
    expect(
      isGitWriteAccessFailure("git write access: remote rejected the push")
    ).toBe(true);
  });

  it("leaves other failures alone", () => {
    expect(isGitWriteAccessFailure("provider error: token invalid")).toBe(
      false
    );
    expect(isGitWriteAccessFailure(undefined)).toBe(false);
  });
});
