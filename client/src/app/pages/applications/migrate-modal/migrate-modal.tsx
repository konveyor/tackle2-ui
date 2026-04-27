import React, { useCallback, useState } from "react";
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Text,
  TextContent,
} from "@patternfly/react-core";

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

export const MigrateModal: React.FC<MigrateModalProps> = ({
  applications,
  isOpen,
  onClose,
}) => {
  const { pushNotification } = useNotifications();
  const { migrators } = useFetchMigrators();
  const [selectedMigratorId, setSelectedMigratorId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const migratorOptions: FilterSelectOptionProps[] = (migrators || []).map(
    (m) => ({
      value: String(m.id),
      label: `${m.name}${m.migrationTarget ? ` (${m.migrationTarget})` : ""}`,
    })
  );

  const selectedMigrator = migrators.find(
    (m) => String(m.id) === selectedMigratorId
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedMigrator) return;
    setIsSubmitting(true);

    try {
      const taskgroupPayload = {
        name: `migration-${selectedMigrator.name}-${Date.now()}`,
        addon: "kai",
        data: {
          sourceRepository: selectedMigrator.sourceRepository,
          assetRepository: selectedMigrator.assetRepository,
          migrationTarget: selectedMigrator.migrationTarget,
          pallet: selectedMigrator.pallet,
        },
        tasks: applications.map((app) => ({
          name: `${selectedMigrator.name}-${app.name}`,
          data: {},
          application: { id: app.id, name: app.name },
        })),
      } as unknown as Taskgroup;

      const created = await createTaskgroup(taskgroupPayload);
      await submitTaskgroup(created);

      pushNotification({
        title: `Migration submitted for ${applications.length} application(s) using "${selectedMigrator.name}". Check Tasks for progress.`,
        variant: "success",
      });
      onClose();
    } catch (error) {
      pushNotification({
        title: `Failed to submit migration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedMigrator, applications, pushNotification, onClose]);

  return (
    <Modal
      title="Run Migration"
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="submit"
          variant={ButtonVariant.primary}
          onClick={handleSubmit}
          isDisabled={!selectedMigrator || isSubmitting}
          isLoading={isSubmitting}
        >
          Run Migration
        </Button>,
        <Button
          key="cancel"
          variant={ButtonVariant.link}
          onClick={onClose}
          isDisabled={isSubmitting}
        >
          Cancel
        </Button>,
      ]}
    >
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
            style={{ color: "var(--pf-v5-global--warning-color--100)" }}
          >
            No migrator configurations found. Create one in Admin → Migrators
            first.
          </Text>
        </TextContent>
      )}
    </Modal>
  );
};

export default MigrateModal;
