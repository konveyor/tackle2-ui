import React from "react";
import { useTranslation } from "react-i18next";
import { Label, Tooltip } from "@patternfly/react-core";

import type { Condition } from "@app/api/agentic/contract";
import { readyCondition } from "@app/utils/skills";

// The helper moved to @app/utils/skills (shared with non-component code);
// re-exported so existing imports from this module keep working.
export { readyCondition };

/**
 * Ready / NotReady / Unknown from a resource's conditions. When the Ready
 * condition carries a reason or message, hovering shows them (the message
 * is the controller's full text, e.g. why inline content was rejected).
 */
export function ReadyLabel({ conditions }: { conditions?: Condition[] }) {
  const { t } = useTranslation();
  const ready = readyCondition(conditions);
  if (!ready) return <Label color="grey">{t("terms.unknown")}</Label>;

  const label =
    ready.status === "True" ? (
      <Label color="green">{t("taskState.Ready")}</Label>
    ) : (
      <Label color="red">
        {ready.reason ?? t("agentic.createRun.notReady")}
      </Label>
    );

  if (!ready.reason && !ready.message) return label;
  return (
    <Tooltip
      content={
        <div style={{ wordBreak: "break-word" }}>
          {ready.reason && <div>{ready.reason}</div>}
          {ready.message && (
            <div style={{ whiteSpace: "pre-wrap" }}>{ready.message}</div>
          )}
        </div>
      }
    >
      {label}
    </Tooltip>
  );
}

export function skillCount(spec: {
  skillCards?: { ref: string }[];
  skillCollections?: { ref: string }[];
}): number {
  return (spec.skillCards?.length ?? 0) + (spec.skillCollections?.length ?? 0);
}
