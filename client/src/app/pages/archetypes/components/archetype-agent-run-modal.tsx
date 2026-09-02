import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from "@patternfly/react-core";

import { Archetype } from "@app/api/models";
import {
  BulkAgentRunModal,
  StartRunsResult,
} from "@app/pages/applications/agent-run-modal";
import { useDecoratedApplications } from "@app/pages/applications/useDecoratedApplications";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchTaskDashboard } from "@app/queries/tasks";

interface ArchetypeAgentRunModalProps {
  archetype: Archetype;
  onClose: () => void;
  onStarted: (result: StartRunsResult) => void;
}

/**
 * Archetype-scoped entry point for agentic workflow runs.
 *
 * There is no archetype association in the run model — an AgentRun binds to a
 * single application (label + env), and the hub/CRD know nothing about
 * archetypes. So "run a workflow for this archetype" is a pure client-side
 * fan-out: resolve the archetype's member applications and hand them to the
 * exact same {@link BulkAgentRunModal} the Applications table uses. Eligibility,
 * credential warnings, per-app partial failure, and the launch landing are all
 * already handled there; this wrapper only does membership resolution.
 *
 * Archetype membership arrives as `Ref[]` (id + name only). The run modal needs
 * the decorated applications (repository, source credential, ...), so we fetch +
 * decorate the full application list and filter to the archetype's members.
 */
export const ArchetypeAgentRunModal: React.FC<ArchetypeAgentRunModalProps> = ({
  archetype,
  onClose,
  onStarted,
}) => {
  const { t } = useTranslation();

  const { data: baseApplications } = useFetchApplications();
  // Only mounted while the modal is open, so eager-enable the dashboard query.
  const { tasks } = useFetchTaskDashboard(true);
  const { applications } = useDecoratedApplications(baseApplications, tasks);

  const memberIds = useMemo(
    () => new Set((archetype.applications ?? []).map((ref) => ref.id)),
    [archetype.applications]
  );
  const memberApplications = useMemo(
    () => applications.filter((app) => memberIds.has(app.id)),
    [applications, memberIds]
  );

  // An archetype with no matching applications has nothing to run. Short-circuit
  // rather than open the bulk modal on an empty set (it would render "0 of 0").
  if (memberApplications.length === 0) {
    return (
      <Modal variant={ModalVariant.small} isOpen onClose={onClose}>
        <ModalHeader title={t("agentic.archetypeRun.title")} />
        <ModalBody>
          <Alert
            variant="info"
            isInline
            title={t("agentic.archetypeRun.noApplicationsTitle")}
          >
            {t("agentic.archetypeRun.noApplicationsBody", {
              archetype: archetype.name,
            })}
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={onClose}>
            {t("actions.close")}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <BulkAgentRunModal
      applications={memberApplications}
      onClose={onClose}
      onStarted={onStarted}
    />
  );
};
