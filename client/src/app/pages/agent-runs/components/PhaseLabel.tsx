import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@patternfly/react-core";

import type { AgentRunPhase } from "@app/api/agentic/contract";

const PHASE_COLORS: Record<string, "grey" | "blue" | "green" | "red"> = {
  Pending: "grey",
  Running: "blue",
  Succeeded: "green",
  Failed: "red",
};

const PHASE_LABEL_KEYS: Record<string, string> = {
  Pending: "taskState.Pending",
  Running: "taskState.Running",
  Succeeded: "taskState.Succeeded",
  Failed: "taskState.Failed",
};

export const PhaseLabel: React.FC<{ phase?: AgentRunPhase }> = ({ phase }) => {
  const { t } = useTranslation();
  const label = phase ?? "Pending";
  const color = PHASE_COLORS[label] ?? "grey";
  const labelKey = PHASE_LABEL_KEYS[label];
  return <Label color={color}>{labelKey ? t(labelKey) : label}</Label>;
};
