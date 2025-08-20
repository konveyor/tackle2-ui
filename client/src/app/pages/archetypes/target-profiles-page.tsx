import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Modal,
  ModalVariant,
  PageSection,
  PageSectionVariants,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Form,
  ActionGroup,
  Alert,
  AlertVariant,
  DualListSelector,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Th,
  Thead,
  Tr,
  Td,
  ActionsColumn,
} from "@patternfly/react-table";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

import type { TargetProfile, Generator } from "@app/api/models";
import { useFetchArchetypeById } from "@app/queries/archetypes";
import { useFetchGenerators } from "@app/queries/generators";
import { useArchetypeMutations } from "./hooks/useArchetypeMutations";
import { ArchetypeTargetProfilesRoute, Paths } from "@app/Paths";
import { matchItemsToRefs } from "@app/utils/model-utils";
import { PageHeader } from "@app/components/PageHeader";

interface TargetProfileFormValues {
  name: string;
  generators: Generator[];
}

interface TargetProfileFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (profile: TargetProfile) => void;
  initialProfile?: TargetProfile;
  existingNames?: string[];
  generators: Generator[];
}

const TargetProfileForm: React.FC<TargetProfileFormProps> = ({
  isOpen,
  onCancel,
  onSave,
  initialProfile,
  existingNames = [],
  generators,
}) => {
  const { t } = useTranslation();

  // Dual list selector state
  const [availableOptions, setAvailableOptions] = useState<Generator[]>([]);
  const [chosenOptions, setChosenOptions] = useState<Generator[]>([]);

  const validationSchema = yup.object().shape({
    name: yup
      .string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "unique-name",
        t("validation.duplicateTargetProfileName"),
        (value) => {
          if (!value) return false;
          const existingNamesList = initialProfile
            ? existingNames.filter((name) => name !== initialProfile.name)
            : existingNames;
          return !existingNamesList.includes(value.trim());
        }
      ),
  });

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
  } = useForm<TargetProfileFormValues>({
    defaultValues: {
      name: initialProfile?.name || "",
      generators: [],
    },
    resolver: yupResolver(validationSchema),
    mode: "onBlur",
  });

  // Initialize dual list selector options when modal opens
  React.useEffect(() => {
    if (isOpen && generators) {
      const selectedGeneratorIds =
        initialProfile?.generators?.map((ref) => ref.id) || [];
      const chosen = generators.filter((g) =>
        selectedGeneratorIds.includes(g.id)
      );
      const available = generators.filter(
        (g) => !selectedGeneratorIds.includes(g.id)
      );

      setChosenOptions(chosen);
      setAvailableOptions(available);
    }
  }, [isOpen, initialProfile, generators]);

  const onListChange = useCallback(
    (
      _event: React.MouseEvent,
      newAvailableOptions: React.ReactNode[],
      newChosenOptions: React.ReactNode[]
    ) => {
      const newAvailable = newAvailableOptions
        .map((node) => node?.toString())
        .map((name) => generators.find((g) => g.name === name))
        .filter(Boolean);

      const newChosen = newChosenOptions
        .map((node) => node?.toString())
        .map((name) => generators.find((g) => g.name === name))
        .filter(Boolean);

      setAvailableOptions(newAvailable);
      setChosenOptions(newChosen);
    },
    [generators]
  );

  const onSubmit = useCallback(
    (values: TargetProfileFormValues) => {
      const profile: TargetProfile = {
        id: initialProfile?.id ?? 0,
        name: values.name.trim(),
        generators:
          matchItemsToRefs(
            generators,
            (g) => g.id,
            chosenOptions.map((g) => g.id)
          ) || [],
      };

      onSave(profile);
      reset();
      onCancel();
    },
    [initialProfile?.id, generators, chosenOptions, onSave, reset, onCancel]
  );

  const handleCancel = useCallback(() => {
    reset();
    setAvailableOptions([]);
    setChosenOptions([]);
    onCancel();
  }, [reset, onCancel]);

  const isFormValid = isValid && chosenOptions.length > 0;

  return (
    <Modal
      variant={ModalVariant.medium}
      title={
        initialProfile
          ? t("dialog.title.updateTargetProfile")
          : t("dialog.title.newTargetProfile")
      }
      isOpen={isOpen}
      onClose={handleCancel}
      onEscapePress={handleCancel}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <HookFormPFTextInput
          control={control}
          name="name"
          label={t("terms.name")}
          fieldId="target-profile-name"
          isRequired
        />

        <div className="pf-v5-u-mt-md">
          <DualListSelector
            availableOptions={availableOptions.map(({ name }) => name)}
            chosenOptions={chosenOptions.map(({ name }) => name)}
            onListChange={onListChange}
            id="target-profile-generators-selector"
            availableOptionsTitle={t("Available Generators")}
            chosenOptionsTitle={t("Chosen Generators")}
          />

          {chosenOptions.length === 0 && (
            <div className="pf-v5-u-mt-sm">
              <Text component="small" className="pf-v5-u-danger-color-100">
                {t("At least one generator must be selected")}
              </Text>
            </div>
          )}
        </div>

        <ActionGroup>
          <Button
            type="button"
            variant="primary"
            isDisabled={!isFormValid}
            onClick={handleSubmit(onSubmit)}
          >
            {initialProfile ? t("actions.save") : t("actions.create")}
          </Button>
          <Button variant="link" onClick={handleCancel}>
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </Modal>
  );
};

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

  const { archetype, isFetching: isArchetypesFetching } =
    useFetchArchetypeById(archetypeId);
  const {
    generators,
    isLoading: isGeneratorsLoading,
    fetchError: generatorsError,
  } = useFetchGenerators();
  const { updateArchetype } = useArchetypeMutations();

  const profiles = archetype?.profiles || [];
  const existingNames = profiles.map((p) => p.name);

  const handleCreateProfile = () => setOpenCreateModal(true);
  const handleEditProfile = (profile: TargetProfile) =>
    setProfileToEdit(profile);
  const handleDeleteProfile = (profile: TargetProfile) =>
    setProfileToDelete(profile);

  const handleSaveProfile = useCallback(
    (profile: TargetProfile) => {
      if (!archetype) return;

      let updatedProfiles: TargetProfile[];

      if (profileToEdit) {
        // Update existing profile
        updatedProfiles = profiles.map((p) =>
          p.id === profileToEdit.id ? profile : p
        );
      } else {
        // Add new profile
        const newProfile = {
          ...profile,
          id: Date.now(), // Temporary ID for UI purposes
        };
        updatedProfiles = [...profiles, newProfile];
      }

      const updatedArchetype = {
        ...archetype,
        profiles: updatedProfiles,
      };

      updateArchetype(updatedArchetype);
      setOpenCreateModal(false);
      setProfileToEdit(null);
    },
    [archetype, profiles, profileToEdit, updateArchetype]
  );

  const handleConfirmDelete = () => {
    if (!profileToDelete || !archetype) return;

    const updatedProfiles = profiles.filter((p) => p.id !== profileToDelete.id);
    const updatedArchetype = {
      ...archetype,
      profiles: updatedProfiles,
    };

    updateArchetype(updatedArchetype);
    setProfileToDelete(null);
  };

  const getGeneratorNames = useCallback(
    (generatorRefs: TargetProfile["generators"]) => {
      if (!generators || !generatorRefs) return [];
      return generatorRefs
        .map((ref) => generators.find((g) => g.id === ref.id)?.name)
        .filter(Boolean) as string[];
    },
    [generators]
  );

  if (isArchetypesFetching && !archetype) {
    return <AppPlaceholder />;
  }

  if (!archetype) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <Alert variant={AlertVariant.warning} title={t("message.notFound")}>
          {t("message.archetypeNotFound")}
        </Alert>
      </PageSection>
    );
  }

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
          when={isArchetypesFetching || isGeneratorsLoading}
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
                      onClick={handleCreateProfile}
                      isDisabled={!generators || generators.length === 0}
                    >
                      {t("dialog.title.newTargetProfile")}
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>

            {generatorsError && (
              <Alert
                variant={AlertVariant.warning}
                title={t("message.errorFetchingGenerators")}
                className="pf-v5-u-mb-md"
              />
            )}

            <Table aria-label="Target profiles table">
              <Thead>
                <Tr>
                  <Th>{t("terms.name")}</Th>
                  <Th>{t("terms.generators")}</Th>
                  <Th screenReaderText="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {profiles.length === 0 ? (
                  <Tr>
                    <Td colSpan={3}>
                      <Text className="pf-v5-u-text-align-center pf-v5-u-color-200">
                        {t("message.noTargetProfilesConfigured")}
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  profiles.map((profile) => (
                    <Tr key={profile.id}>
                      <Td width={40}>{profile.name}</Td>
                      <Td width={60}>
                        {/* TODO: Change render to labels */}
                        {getGeneratorNames(profile.generators).join(", ") ||
                          t("terms.none")}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t("actions.edit"),
                              onClick: () => handleEditProfile(profile),
                            },
                            {
                              title: t("actions.delete"),
                              onClick: () => handleDeleteProfile(profile),
                              isDanger: true,
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </div>
        </ConditionalRender>
      </PageSection>

      {/* Create/Edit Modal */}
      {/* TODO: Edit doesn't load up the existing profile properly. */}
      {generators && (
        <TargetProfileForm
          isOpen={openCreateModal || !!profileToEdit}
          onCancel={() => {
            setOpenCreateModal(false);
            setProfileToEdit(null);
          }}
          onSave={handleSaveProfile}
          initialProfile={profileToEdit || undefined}
          existingNames={existingNames}
          generators={generators}
        />
      )}

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
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default TargetProfilesPage;
