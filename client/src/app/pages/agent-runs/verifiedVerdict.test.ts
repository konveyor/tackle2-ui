import type { Condition } from "@app/api/agentic/contract";
import { VERIFIED_REASON } from "@app/api/agentic/contract";

import { verifiedVerdict } from "./runOutcome";

const verified = (
  status: Condition["status"],
  reason?: string,
  message?: string
): Condition[] => [{ type: "Verified", status, reason, message }];

describe("verifiedVerdict", () => {
  it("says nothing when the condition is absent", () => {
    expect(verifiedVerdict(undefined)).toBeUndefined();
    expect(verifiedVerdict([])).toBeUndefined();
    expect(
      verifiedVerdict([{ type: "Succeeded", status: "True" }])
    ).toBeUndefined();
  });

  it("reads a measured pass as passed", () => {
    expect(verifiedVerdict(verified("True", VERIFIED_REASON.passed))).toEqual({
      state: "passed",
      message: undefined,
    });
  });

  it("reads a failed verification, keeping the message", () => {
    expect(
      verifiedVerdict(
        verified("False", VERIFIED_REASON.failed, "npm run tsc exited 2")
      )
    ).toEqual({ state: "failed", message: "npm run tsc exited 2" });
  });

  it("keeps notRun distinct from a pass", () => {
    const verdict = verifiedVerdict(
      verified("False", VERIFIED_REASON.notRun, "no ## Verification section")
    );
    expect(verdict?.state).toBe("notRun");
  });

  it("reports an unreadable verdict as notReported", () => {
    expect(
      verifiedVerdict(verified("Unknown", VERIFIED_REASON.notReported))?.state
    ).toBe("notReported");
  });

  // The controller documents the reason set as closed, but the console
  // must not turn a reason it has never seen into a green label.
  it("degrades an unrecognised reason to notReported", () => {
    expect(verifiedVerdict(verified("True", "SomethingNew"))?.state).toBe(
      "notReported"
    );
  });

  // True means a measured pass and nothing else; a mismatched pairing is
  // a controller the console does not understand, not a success.
  it("refuses to call a non-True VerificationPassed a pass", () => {
    expect(
      verifiedVerdict(verified("Unknown", VERIFIED_REASON.passed))?.state
    ).toBe("notReported");
  });
});
