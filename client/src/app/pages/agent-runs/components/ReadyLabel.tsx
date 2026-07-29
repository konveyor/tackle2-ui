import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@patternfly/react-core";

import type { Condition } from "@app/api/agentic/contract";

export function readyCondition(
  conditions?: Condition[]
): Condition | undefined {
  return conditions?.find((c) => c.type === "Ready");
}

export function ReadyLabel({ conditions }: { conditions?: Condition[] }) {
  const { t } = useTranslation();
  const ready = readyCondition(conditions);
  if (!ready) return <Label color="grey">{t("terms.unknown")}</Label>;
  return ready.status === "True" ? (
    <Label color="green">{t("taskState.Ready")}</Label>
  ) : (
    <Label color="red">{ready.reason ?? t("agentic.createRun.notReady")}</Label>
  );
}

export function skillCount(spec: {
  skillCards?: { ref: string }[];
  skillCollections?: { ref: string }[];
}): number {
  return (spec.skillCards?.length ?? 0) + (spec.skillCollections?.length ?? 0);
}
