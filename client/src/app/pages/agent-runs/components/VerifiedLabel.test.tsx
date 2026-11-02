import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import type { Condition } from "@app/api/agentic/contract";
import { VERIFIED_REASON } from "@app/api/agentic/contract";

import { VerifiedLabel } from "./VerifiedLabel";

const verified = (status: Condition["status"], reason: string): Condition[] => [
  { type: "Verified", status, reason },
];

describe("VerifiedLabel", () => {
  it("renders nothing without the condition", () => {
    const { container } = render(<VerifiedLabel conditions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a measured pass", () => {
    render(
      <VerifiedLabel conditions={verified("True", VERIFIED_REASON.passed)} />
    );
    expect(screen.getByText("agentic.verified.passed")).toBeInTheDocument();
  });

  it("shows a failed verification", () => {
    render(
      <VerifiedLabel conditions={verified("False", VERIFIED_REASON.failed)} />
    );
    expect(screen.getByText("agentic.verified.failed")).toBeInTheDocument();
  });

  it("shows notRun, which must not be mistaken for a pass", () => {
    render(
      <VerifiedLabel conditions={verified("False", VERIFIED_REASON.notRun)} />
    );
    expect(screen.getByText("agentic.verified.notRun")).toBeInTheDocument();
  });

  // Every run predates the measuring harness until it ships, so the list
  // would otherwise carry the same grey chip on every row.
  it("hides notReported by default and shows it when asked", () => {
    const conditions = verified("Unknown", VERIFIED_REASON.notReported);
    const { container, rerender } = render(
      <VerifiedLabel conditions={conditions} />
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<VerifiedLabel conditions={conditions} showNotReported />);
    expect(
      screen.getByText("agentic.verified.notReported")
    ).toBeInTheDocument();
  });
});
