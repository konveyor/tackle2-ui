import React from "react";
import { useTranslation } from "react-i18next";
import { Button, HelperTextItem } from "@patternfly/react-core";

/**
 * The target-branch hint shown when a create dialog was seeded from an
 * earlier run ("Run again").
 *
 * A re-run deliberately gets a fresh `konveyor/migration-<ts>` branch, so the
 * earlier run's results stay where they are. That is right once a run has
 * pushed, and wrong after one that failed before pushing anything — which is
 * the case that drives most re-runs, and which leaves the user retyping the
 * branch name they actually wanted.
 *
 * Nothing in `AgentRunStatus` says whether a push happened (the branch panel
 * infers it from a GitHub 404, which is host-specific, rate-limited and
 * racy), so this does not guess: it names the previous branch and offers it
 * in one click, leaving the default alone (konveyor/tackle2-ui#3706).
 */
export const ReusePreviousBranch: React.FC<{
  /** Target branch of the run the form was seeded from, when there was one. */
  previousBranch?: string;
  /** Branch currently in the field; the hint hides once they match. */
  currentBranch: string;
  onReuse: (branch: string) => void;
}> = ({ previousBranch, currentBranch, onReuse }) => {
  const { t } = useTranslation();

  if (!previousBranch || previousBranch === currentBranch) return null;

  return (
    <HelperTextItem>
      {t("agentic.createRun.newBranchForRerun")}{" "}
      <Button variant="link" isInline onClick={() => onReuse(previousBranch)}>
        {t("agentic.createRun.reusePreviousBranch", {
          branch: previousBranch,
        })}
      </Button>
    </HelperTextItem>
  );
};
