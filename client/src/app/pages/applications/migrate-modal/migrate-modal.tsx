import React, { useCallback, useState } from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Spinner,
  Text,
  TextContent,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";

import { MigratorConfig, Taskgroup } from "@app/api/models";
import { createTaskgroup, submitTaskgroup } from "@app/api/rest";
import { FilterSelectOptionProps } from "@app/components/FilterToolbar/FilterToolbar";
import TypeaheadSelect from "@app/components/FilterToolbar/components/TypeaheadSelect";
import { useNotifications } from "@app/components/NotificationsContext";
import { useFetchMigrators } from "@app/queries/migrators";

export interface MigrateModalProps {
  applications: Array<{ id: number; name: string }>;
  isOpen: boolean;
  onClose: () => void;
}

type SubmitStatus =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; taskgroupId: number; taskgroupName: string }
  | { phase: "error"; message: string };

export const MigrateModal: React.FC<MigrateModalProps> = ({
  applications,
  isOpen,
  onClose,
}) => {
  const { pushNotification } = useNotifications();
  const { migrators } = useFetchMigrators();
  const [selectedMigratorId, setSelectedMigratorId] = useState<string>("");
  const [status, setStatus] = useState<SubmitStatus>({ phase: "idle" });

  const migratorOptions: FilterSelectOptionProps[] = (migrators || []).map(
    (m) => ({
      value: String(m.id),
      label: `${m.name}${m.migrationTarget ? ` (${m.migrationTarget})` : ""}`,
    })
  );

  const selectedMigrator = migrators.find(
    (m) => String(m.id) === selectedMigratorId
  );

  const handleClose = () => {
    setStatus({ phase: "idle" });
    setSelectedMigratorId("");
    onClose();
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedMigrator) return;
    setStatus({ phase: "submitting" });

    try {
      const taskgroupPayload = {
        name: `migration-${selectedMigrator.name}-${Date.now()}`,
        kind: "migration",
        data: {
          sourceRepository: selectedMigrator.sourceRepository,
          assetRepository: selectedMigrator.assetRepository,
          migrationTarget: selectedMigrator.migrationTarget,
          pallet: selectedMigrator.pallet,
        },
        tasks: applications.map((app) => ({
          name: `${selectedMigrator.name}.${app.name}.migration`,
          data: {},
          application: { id: app.id, name: app.name },
        })),
      } as unknown as Taskgroup;

      const created = await createTaskgroup(taskgroupPayload);
      await submitTaskgroup(created);

      setStatus({
        phase: "success",
        taskgroupId: created.id,
        taskgroupName: created.name,
      });

      pushNotification({
        title: `Migration submitted for ${applications.length} application(s)`,
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus({ phase: "error", message });

      pushNotification({
        title: `Failed to submit migration: ${message}`,
        variant: "danger",
      });
    }
  }, [selectedMigrator, applications, pushNotification]);

  return (
    <Modal
      title="Run Migration"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={handleClose}
      actions={
        status.phase === "success"
          ? [
              <Button
                key="done"
                variant={ButtonVariant.primary}
                onClick={handleClose}
              >
                Done
              </Button>,
            ]
          : [
              <Button
                key="submit"
                variant={ButtonVariant.primary}
                onClick={handleSubmit}
                isDisabled={!selectedMigrator || status.phase === "submitting"}
                isLoading={status.phase === "submitting"}
              >
                Run Migration
              </Button>,
              <Button
                key="cancel"
                variant={ButtonVariant.link}
                onClick={handleClose}
                isDisabled={status.phase === "submitting"}
              >
                Cancel
              </Button>,
            ]
      }
    >
      {/* Success state */}
      {status.phase === "success" && (
        <Alert
          variant="success"
          isInline
          title="Migration submitted successfully"
          style={{ marginBottom: 16 }}
        >
          <TextContent>
            <Text component="small">
              <CheckCircleIcon
                style={{ color: "var(--pf-v5-global--success-color--100)" }}
              />{" "}
              TaskGroup <strong>#{status.taskgroupId}</strong> created and
              submitted.
            </Text>
            <Text component="small">
              Name: <code>{status.taskgroupName}</code>
            </Text>
            <Text component="small">
              Kind: <code>migration</code> | State: <strong>Ready</strong>
            </Text>
            <Text component="small">
              {applications.length} application(s) queued for migration using
              &quot;{selectedMigrator?.name}&quot;.
            </Text>
          </TextContent>
        </Alert>
      )}

      {/* Error state */}
      {status.phase === "error" && (
        <Alert
          variant="danger"
          isInline
          title="Migration submission failed"
          style={{ marginBottom: 16 }}
        >
          <TextContent>
            <Text component="small">
              <ExclamationCircleIcon
                style={{ color: "var(--pf-v5-global--danger-color--100)" }}
              />{" "}
              {status.message}
            </Text>
          </TextContent>
        </Alert>
      )}

      {/* Submitting state */}
      {status.phase === "submitting" && (
        <Alert
          variant="info"
          isInline
          title="Submitting migration..."
          style={{ marginBottom: 16 }}
        >
          <Spinner size="md" /> Creating TaskGroup and submitting to Hub...
        </Alert>
      )}

      {/* Form — only show when idle or error */}
      {(status.phase === "idle" || status.phase === "error") && (
        <>
          <TextContent>
            <Text component="p">
              Select a migrator configuration to run against{" "}
              <strong>
                {applications.length} application
                {applications.length !== 1 ? "s" : ""}
              </strong>
              :
            </Text>
            <Text component="small">
              {applications.map((a) => a.name).join(", ")}
            </Text>
          </TextContent>

          <Form style={{ marginTop: 16 }}>
            <FormGroup label="Migrator" fieldId="migrator-select" isRequired>
              <TypeaheadSelect
                placeholderText="Select a migrator configuration..."
                toggleId="migrator-select-toggle"
                toggleAriaLabel="Migrator config select"
                ariaLabel="migrator"
                value={selectedMigratorId}
                options={migratorOptions}
                onSelect={(selection) => setSelectedMigratorId(selection ?? "")}
              />
            </FormGroup>
          </Form>

          {selectedMigrator && (
            <TextContent style={{ marginTop: 16 }}>
              <Text component="small">
                <strong>Source:</strong>{" "}
                {selectedMigrator.sourceRepository?.url || "—"}
                {selectedMigrator.sourceRepository?.branch
                  ? ` (${selectedMigrator.sourceRepository.branch})`
                  : ""}
              </Text>
              <Text component="small">
                <strong>Asset Output:</strong>{" "}
                {selectedMigrator.assetRepository?.url || "—"} →{" "}
                {selectedMigrator.assetRepository?.branch || "—"}
              </Text>
              {selectedMigrator.migrationTarget && (
                <Text component="small">
                  <strong>Target:</strong> {selectedMigrator.migrationTarget}
                </Text>
              )}
            </TextContent>
          )}

          {migrators.length === 0 && (
            <TextContent style={{ marginTop: 16 }}>
              <Text
                component="small"
                style={{
                  color: "var(--pf-v5-global--warning-color--100)",
                }}
              >
                No migrator configurations found. Create one in Admin →
                Migrators first.
              </Text>
            </TextContent>
          )}
        </>
      )}
    </Modal>
  );
};

export default MigrateModal;
