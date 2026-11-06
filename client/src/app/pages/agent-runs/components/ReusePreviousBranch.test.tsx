import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReusePreviousBranch } from "./ReusePreviousBranch";

const FRESH = "konveyor/migration-1793632232";
const PREVIOUS = "dogfood/react-query-v5";

/** The react-i18next mock returns the key and drops interpolation. */
const REUSE = "agentic.createRun.reusePreviousBranch";

describe("ReusePreviousBranch", () => {
  it("renders nothing when the form was not seeded from a run", () => {
    const { container } = render(
      <ReusePreviousBranch currentBranch={FRESH} onReuse={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing once the field already holds the previous branch", () => {
    const { container } = render(
      <ReusePreviousBranch
        previousBranch={PREVIOUS}
        currentBranch={PREVIOUS}
        onReuse={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers the previous branch while the field holds a fresh one", () => {
    render(
      <ReusePreviousBranch
        previousBranch={PREVIOUS}
        currentBranch={FRESH}
        onReuse={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: REUSE })).toBeInTheDocument();
  });

  it("hands the previous branch back when clicked", async () => {
    const onReuse = jest.fn();
    render(
      <ReusePreviousBranch
        previousBranch={PREVIOUS}
        currentBranch={FRESH}
        onReuse={onReuse}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: REUSE }));
    expect(onReuse).toHaveBeenCalledWith(PREVIOUS);
  });
});
