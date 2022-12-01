import { render, screen } from "@app/test-config/test-utils";
import React from "react";
import { RiskLabel } from "../risk-label";

describe("RiskLabel", () => {
  it("Green", () => {
    const { container } = render(<RiskLabel risk="GREEN" />);
    expect(container.firstChild).toHaveClass("pf-c-label pf-m-green");
    expect(screen.getByText("risks.low")).toBeInTheDocument();
  });
  it("Amber", () => {
    const { container } = render(<RiskLabel risk="AMBER" />);
    expect(container.firstChild).toHaveClass("pf-c-label pf-m-orange");
    expect(screen.getByText("risks.medium")).toBeInTheDocument();
  });
  it("Red", () => {
    const { container } = render(<RiskLabel risk="RED" />);
    expect(container.firstChild).toHaveClass("pf-c-label pf-m-red");
    expect(screen.getByText("risks.high")).toBeInTheDocument();
  });
  it("Unknown", () => {
    const { container } = render(<RiskLabel risk="UNKNOWN" />);
    expect(container.firstChild).toHaveClass("pf-c-label");
    expect(screen.getByText("risks.unknown")).toBeInTheDocument();
  });
  it("Not defined risk", () => {
    const { container } = render(<RiskLabel risk={"ANYTHING_ELSE" as any} />);
    expect(screen.getByText("ANYTHING_ELSE")).toBeInTheDocument();
  });
});
