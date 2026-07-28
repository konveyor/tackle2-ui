import React from "react";
import { Label } from "@patternfly/react-core";

import type { AgentRunPhase } from "@app/api/agentic/contract";

const PHASE_COLORS: Record<string, "grey" | "blue" | "green" | "red"> = {
  Pending: "grey",
  Running: "blue",
  Succeeded: "green",
  Failed: "red",
};

export const PhaseLabel: React.FC<{ phase?: AgentRunPhase }> = ({ phase }) => {
  const label = phase ?? "Pending";
  const color = PHASE_COLORS[label] ?? "grey";
  return <Label color={color}>{label}</Label>;
};
