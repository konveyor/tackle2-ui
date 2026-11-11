import React from "react";
import { useTranslation } from "react-i18next";
import { Content } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { HarnessVerification } from "@app/api/agentic/contract";

/**
 * The evidence behind the `Verified` condition: the commands the harness
 * re-ran on the tree it was about to push, and what they returned
 * (agentic-controller#300).
 *
 * The condition carries the verdict and is what the rest of the console
 * branches on. This is the detail a reviewer needs to act on it — which
 * command, which exit code — and it is read straight from
 * `terminationData`, which the controller passes through without
 * interpreting.
 */
export const VerificationPanel: React.FC<{
  verification?: HarnessVerification;
}> = ({ verification }) => {
  const { t } = useTranslation();
  const commands = verification?.commands ?? [];

  if (!verification) return null;

  return (
    <>
      <Content component="h4">{t("agentic.verified.evidenceHeading")}</Content>
      {verification.reason && (
        <Content component="p">{verification.reason}</Content>
      )}
      {/*
        Which tree the verdict describes. A result that does not name its
        commit says a tree passed without saying which tree, and the branch
        can have moved since.
      */}
      {verification.commit && (
        <Content component="p">
          {t("agentic.verified.atCommit")}{" "}
          <code>{verification.commit.slice(0, 9)}</code>
        </Content>
      )}
      {commands.length > 0 && (
        <Table variant="compact" aria-label={t("agentic.verified.tableLabel")}>
          <Thead>
            <Tr>
              <Th>{t("agentic.verified.colLabel")}</Th>
              <Th>{t("agentic.verified.colCommand")}</Th>
              <Th>{t("agentic.verified.colExitCode")}</Th>
              <Th>{t("agentic.verified.colSeconds")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {commands.map((step, i) => (
              <Tr key={`${step.label ?? ""}-${i}`}>
                <Td>{step.label || "-"}</Td>
                <Td>
                  {step.command ? <code>{step.command}</code> : step.reason}
                </Td>
                <Td>
                  {/* An explicit 0 must read as 0, not as "no exit code". */}
                  {step.exitCode != null ? step.exitCode : (step.status ?? "-")}
                </Td>
                <Td>
                  {step.seconds != null
                    ? t("agentic.verified.seconds", {
                        count: Math.round(step.seconds),
                      })
                    : "-"}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {commands.some((c) => c.output) && (
        <Content component="pre" className="run-verification-output">
          {commands
            .filter((c) => c.output)
            .map((c) => `$ ${c.command ?? c.label}\n${c.output}`)
            .join("\n\n")}
        </Content>
      )}
    </>
  );
};
