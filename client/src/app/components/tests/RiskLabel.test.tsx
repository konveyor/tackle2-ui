import { render, screen } from "@app/test-config/test-utils";

import { RiskLabel } from "../RiskLabel";

describe("RiskLabel", () => {
  it("Green", () => {
    const { container } = render(<RiskLabel risk="green" />);
    expect(container.firstChild).toHaveClass("pf-v5-c-label pf-m-green");
    expect(screen.getByText("risks.low")).toBeInTheDocument();
  });
  it("Amber", () => {
    const { container } = render(<RiskLabel risk="yellow" />);
    expect(container.firstChild).toHaveClass("pf-v5-c-label pf-m-orange");
    expect(screen.getByText("risks.medium")).toBeInTheDocument();
  });
  it("Red", () => {
    const { container } = render(<RiskLabel risk="red" />);
    expect(container.firstChild).toHaveClass("pf-v5-c-label pf-m-red");
    expect(screen.getByText("risks.high")).toBeInTheDocument();
  });
  it("Unknown", () => {
    const { container } = render(<RiskLabel risk="unknown" />);
    expect(container.firstChild).toHaveClass("pf-v5-c-label");
    expect(screen.getByText("risks.unknown")).toBeInTheDocument();
  });
  it("Not defined risk", () => {
    const { container } = render(<RiskLabel risk={"ANYTHING_ELSE"} />);
    expect(container.firstChild).toHaveClass("pf-v5-c-label");
    expect(screen.getByText("ANYTHING_ELSE")).toBeInTheDocument();
  });
});
