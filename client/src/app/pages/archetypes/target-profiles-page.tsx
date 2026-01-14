import { useState } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
  PageSectionVariants,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { ArchetypeTargetProfilesRoute, Paths } from "@app/Paths";
import type { TargetProfile } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { PageHeader } from "@app/components/PageHeader";
import { ConditionalTableBody } from "@app/components/TableControls";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { useFetchArchetypeById } from "@app/queries/archetypes";

import TargetProfileForm from "./components/target-profile-form";
import { useArchetypeMutations } from "./hooks/useArchetypeMutations";

const TargetProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const { archetypeId } = useParams<ArchetypeTargetProfilesRoute>();

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [profileToEdit, setProfileToEdit] = useState<TargetProfile | null>(
    null
  );
  const [profileToDelete, setProfileToDelete] = useState<TargetProfile | null>(
    null
  );

  const {
    archetype,
    isFetching: isArchetypesFetching,
    fetchError,
  } = useFetchArchetypeById(archetypeId);

  const { addTargetProfile, updateTargetProfile, deleteTargetProfile } =
    useArchetypeMutations();

  const onAddProfile = (profile: TargetProfile) => {
    if (!archetype) return;
    addTargetProfile(archetype, profile);
    setOpenCreateModal(false);
  };

  const onEditProfile = (profile: TargetProfile) => {
    if (!archetype) return;
    updateTargetProfile(archetype, profile);
    setProfileToEdit(null);
  };

  const onDeleteProfile = (profile: TargetProfile | null) => {
    if (!archetype || !profile) return;
    deleteTargetProfile(archetype, profile);
    setProfileToDelete(null);
  };

  if (!archetype) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <Alert variant={AlertVariant.warning} title={t("message.notFound")}>
          {t("message.archetypeNotFound")}
        </Alert>
      </PageSection>
    );
  }

  const profiles = archetype?.profiles || [];
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <PageHeader
          title={t("titles.archetypeTargetProfiles", {
            archetypeName: archetype.name,
          })}
          breadcrumbs={[
            {
              title: t("terms.archetypes"),
              path: Paths.archetypes,
            },
            {
              title: archetype.name,
            },
          ]}
        />
      </PageSection>

      <PageSection>
        <ConditionalRender
          when={isArchetypesFetching}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar>
              <ToolbarContent>
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button
                      type="button"
                      id="create-target-profile"
                      aria-label="Create new target profile"
                      variant={ButtonVariant.primary}
                      onClick={() => setOpenCreateModal(true)}
                    >
                      {t("dialog.title.newTargetProfile")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>

            <Table aria-label="Target profiles table">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.generators")}</Th>
                  <Th>{t("terms.analysisProfile")}</Th>
                  <Th screenReaderText="Actions" />
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isArchetypesFetching}
                isError={!!fetchError}
                isNoData={profiles.length === 0}
                noDataEmptyState={
                  <EmptyState variant="sm">
                    <EmptyStateHeader
                      titleText={t("message.noTargetProfilesTitle")}
                      headingLevel="h2"
                      icon={<EmptyStateIcon icon={CubesIcon} />}
                    />
                    <EmptyStateBody>
                      {t("message.noTargetProfilesCreate")}
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={4}
              >
                <Tbody>
                  {profiles.map((profile) => (
                    <Tr key={profile.id}>
                      <Td width={25}>{profile.name}</Td>
                      <Td width={35}>
                        <LabelsFromItems items={profile.generators} />
                      </Td>
                      <Td width={25}>{profile.analysisProfile?.name ?? "-"}</Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => setProfileToEdit(profile),
                            },
                            {
                              title: t("actions.delete"),
                              onClick: () => setProfileToDelete(profile),
                              isDanger: true,
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </Table>
          </div>
        </ConditionalRender>
      </PageSection>

      {/* Create Modal */}
      <TargetProfileForm
        key={openCreateModal ? "opened" : "closed"}
        isOpen={openCreateModal}
        archetype={archetype}
        onCancel={() => setOpenCreateModal(false)}
        onSave={(profile) => onAddProfile(profile)}
      />

      {/* Edit Modal */}
      <TargetProfileForm
        key={profileToEdit?.id ?? -1}
        isOpen={!!profileToEdit}
        archetype={archetype}
        profile={profileToEdit}
        onCancel={() => setProfileToEdit(null)}
        onSave={(profile) => onEditProfile(profile)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!profileToDelete}
        titleIconVariant={"warning"}
        title={t("dialog.title.delete", {
          what: t("terms.targetProfile"),
        })}
        message={
          profileToDelete && (
            <>
              {t("dialog.message.delete", {
                what: t("terms.targetProfile").toLowerCase(),
              })}
              <br />
              <strong>{profileToDelete.name}</strong>
            </>
          )
        }
        confirmBtnLabel={t("actions.delete")}
        confirmBtnVariant={ButtonVariant.danger}
        cancelBtnLabel={t("actions.cancel")}
        onCancel={() => setProfileToDelete(null)}
        onClose={() => setProfileToDelete(null)}
        onConfirm={() => onDeleteProfile(profileToDelete)}
      />
    </>
  );
};

export default TargetProfilesPage;
