import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  TextInput,
} from "@patternfly/react-core";

import type { AgentWorkflow } from "@app/api/agentic/contract";
import { defaultTargetBranch } from "@app/api/agentic/contract";
import { readyCondition } from "@app/pages/agent-runs/components/ReadyLabel";
import { useFetchWorkflows } from "@app/queries/workflows";
import { RunBlocker, partitionByRunEligibility } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { DecoratedApplication } from "../useDecoratedApplications";

import {
  StartRunsResult,
  useStartAgentWorkflowRuns,
} from "./useStartAgentWorkflowRuns";

/**
 * Selectable unless the controller has EXPLICITLY marked the workflow not
 * ready. No status yet fails open — the shim re-validates on create.
 */
function isSelectable(workflow: AgentWorkflow): boolean {
  return readyCondition(workflow.status?.conditions)?.status !== "False";
}

interface BulkAgentRunModalProps {
  applications: DecoratedApplication[];
  onClose: () => void;
  /** Handed the outcome so the caller owns the notification. */
  onStarted: (result: StartRunsResult) => void;
}

export const BulkAgentRunModal: React.FC<BulkAgentRunModalProps> = ({
  applications,
  onClose,
  onStarted,
}) => {
  const { t } = useTranslation();
  const {
    workflows,
    isLoading: workflowsLoading,
    fetchError: workflowsError,
  } = useFetchWorkflows();

  const [workflowName, setWorkflowName] = useState("");
  const [targetBranch, setTargetBranch] = useState(() => defaultTargetBranch());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { startRuns } = useStartAgentWorkflowRuns();

  const selectedWorkflow = workflows.find(
    (w) => w.metadata.name === workflowName
  );

  // One shared target branch is safe: applications are distinct repositories,
  // and the default is timestamped. Where it DOES collide with an
  // application's own source branch the harness would refuse to push, so that
  // application is excluded below rather than blocking the whole batch.
  const { eligible, excluded } = useMemo(
    () => partitionByRunEligibility(applications, () => targetBranch),
    [applications, targetBranch]
  );

  const blockerText = (blocker: RunBlocker): string => {
    switch (blocker.kind) {
      case "noRepository":
        return t("agentic.bulkRun.excludedNoRepository");
      case "branchMatchesSource":
        return t("agentic.bulkRun.excludedBranchMatchesSource", {
          branch: blocker.branch,
        });
      case "branchInvalid":
        return blocker.detail;
    }
  };

  // A branch that is malformed (rather than merely colliding) fails for every
  // application — that is a form error, not an exclusion.
  const branchMalformed = excluded.some(
    ({ blocker }) => blocker.kind === "branchInvalid"
  );

  const canSubmit =
    !!selectedWorkflow &&
    isSelectable(selectedWorkflow) &&
    !branchMalformed &&
    eligible.length > 0 &&
    !submitting;

  const submit = async () => {
    if (!selectedWorkflow || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await startRuns({
        workflowRef: selectedWorkflow.metadata.name ?? workflowName,
        applications: eligible,
        targetBranch: targetBranch.trim(),
      });
      onStarted(result);
    } catch (error) {
      setSubmitError(getAxiosErrorMessage(error as never));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => {
        if (!submitting) onClose();
      }}
    >
      <ModalHeader
        title={t("agentic.bulkRun.title")}
        description={t("agentic.bulkRun.description", {
          count: applications.length,
        })}
      />
      <ModalBody>
        {workflowsError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.bulkRun.failedLoadWorkflows")}
            style={{ marginBottom: "1rem" }}
          >
            {getAxiosErrorMessage(workflowsError)}
          </Alert>
        )}
        {submitError && (
          <Alert
            variant="danger"
            isInline
            title={t("agentic.bulkRun.startFailed")}
            style={{ marginBottom: "1rem" }}
          >
            {submitError}
          </Alert>
        )}

        {workflowsLoading && workflows.length === 0 && !workflowsError ? (
          <Spinner aria-label={t("agentic.bulkRun.loadingWorkflows")} />
        ) : workflows.length === 0 ? (
          <Alert
            variant="warning"
            isInline
            title={t("agentic.bulkRun.noWorkflowsTitle")}
          >
            {t("agentic.bulkRun.noWorkflowsBody")}
          </Alert>
        ) : (
          <Form
            id="bulk-agent-run-form"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <FormGroup
              label={t("terms.workflow")}
              isRequired
              fieldId="bulk-run-workflow"
            >
              <FormSelect
                id="bulk-run-workflow"
                value={workflowName}
                onChange={(_e, v) => setWorkflowName(v)}
              >
                <FormSelectOption
                  value=""
                  label={t("agentic.bulkRun.selectWorkflowPlaceholder")}
                  isDisabled
                />
                {workflows.map((w) => (
                  <FormSelectOption
                    key={w.metadata.name}
                    value={w.metadata.name}
                    label={
                      (w.metadata.name ?? "") +
                      (isSelectable(w)
                        ? ""
                        : ` ${t("agentic.workflowRuns.notReadySuffix")}`)
                    }
                    isDisabled={!isSelectable(w)}
                  />
                ))}
              </FormSelect>
            </FormGroup>

            <FormGroup
              label={t("terms.targetBranch")}
              isRequired
              fieldId="bulk-run-target-branch"
            >
              <TextInput
                id="bulk-run-target-branch"
                isRequired
                value={targetBranch}
                onChange={(_e, v) => setTargetBranch(v)}
                validated={branchMalformed ? "error" : "default"}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    variant={branchMalformed ? "error" : "default"}
                  >
                    {t("agentic.bulkRun.targetBranchHelper")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <Alert
              variant={eligible.length === 0 ? "danger" : "info"}
              isInline
              title={t("agentic.bulkRun.eligibilitySummary", {
                eligible: eligible.length,
                total: applications.length,
              })}
            >
              {excluded.length > 0 && (
                <List>
                  {excluded.map(({ application, blocker }) => (
                    <ListItem key={application.id}>
                      <strong>{application.name}</strong> —{" "}
                      {blockerText(blocker)}
                    </ListItem>
                  ))}
                </List>
              )}
            </Alert>

            {eligible.length > 0 && (
              <HelperText>
                <HelperTextItem>
                  {t("agentic.bulkRun.podWarning", { count: eligible.length })}
                </HelperTextItem>
              </HelperText>
            )}
          </Form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          id="bulk-agent-run-submit"
          variant="primary"
          isDisabled={!canSubmit}
          isLoading={submitting}
          onClick={() => void submit()}
        >
          {t("agentic.bulkRun.startRuns", { count: eligible.length })}
        </Button>
        <Button
          id="bulk-agent-run-cancel"
          variant="link"
          isDisabled={submitting}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
