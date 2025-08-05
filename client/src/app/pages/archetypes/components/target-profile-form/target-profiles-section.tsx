import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormGroup,
  Stack,
  StackItem,
  Text,
  Flex,
  FlexItem,
  Label,
  Divider,
} from "@patternfly/react-core";
import {
  PlusCircleIcon,
  PencilAltIcon,
  TrashIcon,
} from "@patternfly/react-icons";
import { TargetProfile } from "@app/api/models";
import { TargetProfileForm } from "./target-profile-form";
import { useFetchGenerators } from "@app/queries/generators";
import { ConfirmDialog } from "@app/components/ConfirmDialog";

export interface TargetProfilesSectionProps {
  profiles: TargetProfile[];
  onChange: (profiles: TargetProfile[]) => void;
}

export const TargetProfilesSection: React.FC<TargetProfilesSectionProps> = ({
  profiles,
  onChange,
}) => {
  const { t } = useTranslation();
  const { generators } = useFetchGenerators();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<
    TargetProfile | undefined
  >();
  const [profileToDelete, setProfileToDelete] = useState<
    TargetProfile | undefined
  >();

  const existingNames = useMemo(() => profiles.map((p) => p.name), [profiles]);

  const handleCreateProfile = useCallback(() => {
    setEditingProfile(undefined);
    setIsFormOpen(true);
  }, []);

  const handleEditProfile = useCallback((profile: TargetProfile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  }, []);

  const handleDeleteProfile = useCallback((profile: TargetProfile) => {
    setProfileToDelete(profile);
  }, []);

  const handleConfirmDelete = () => {
    if (profileToDelete) {
      // Use both id and name for matching to handle temporary IDs
      const updatedProfiles = profiles.filter(
        (p) => p.id !== profileToDelete.id && p.name !== profileToDelete.name
      );
      onChange(updatedProfiles);
      setProfileToDelete(undefined);
    }
  };

  const handleSaveProfile = useCallback(
    (profile: TargetProfile) => {
      let updatedProfiles: TargetProfile[];

      if (editingProfile) {
        // Update existing profile
        updatedProfiles = profiles.map((p) =>
          p.id === editingProfile.id || p.name === editingProfile.name
            ? profile
            : p
        );
      } else {
        // Add new profile with temporary client-side ID for UI purposes only
        // This ID will be excluded when sending to backend
        const newProfile = {
          ...profile,
          id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        updatedProfiles = [...profiles, newProfile];
      }

      onChange(updatedProfiles);
      setIsFormOpen(false);
      setEditingProfile(undefined);
    },
    [editingProfile, profiles, onChange]
  );

  const getGeneratorNames = useCallback(
    (generatorRefs: TargetProfile["generators"]) => {
      if (!generators || !generatorRefs) return [];
      return generatorRefs
        .map((ref) => generators.find((g) => g.id === ref.id)?.name)
        .filter(Boolean) as string[];
    },
    [generators]
  );

  return (
    <>
      <FormGroup label={t("terms.targetProfiles")} fieldId="target-profiles">
        <Card isPlain>
          <CardHeader>
            <CardTitle>
              <Flex>
                <FlexItem>
                  <Text component="h4">{t("terms.targetProfiles")}</Text>
                </FlexItem>
                <FlexItem align={{ default: "alignRight" }}>
                  <Button
                    variant="link"
                    icon={<PlusCircleIcon />}
                    onClick={handleCreateProfile}
                  >
                    {t("actions.create", { what: t("terms.targetProfile") })}
                  </Button>
                </FlexItem>
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {profiles.length === 0 ? (
              <Text component="p" className="pf-v5-u-color-200">
                {t("message.noTargetProfilesConfigured")}
              </Text>
            ) : generators ? (
              <Stack hasGutter>
                {profiles.map((profile, index) => (
                  <StackItem key={profile.id || profile.name || index}>
                    <Card isFlat>
                      <CardHeader>
                        <CardTitle>
                          <Flex>
                            <FlexItem>
                              <Text component="h5">{profile.name}</Text>
                            </FlexItem>
                            <FlexItem align={{ default: "alignRight" }}>
                              <Button
                                variant="plain"
                                aria-label={t("actions.edit")}
                                onClick={() => handleEditProfile(profile)}
                                icon={<PencilAltIcon />}
                                size="sm"
                              />
                              <Button
                                variant="plain"
                                aria-label={t("actions.delete")}
                                onClick={() => handleDeleteProfile(profile)}
                                icon={<TrashIcon />}
                                size="sm"
                                isDanger
                              />
                            </FlexItem>
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <div>
                          <Text component="small" className="pf-v5-u-color-200">
                            {t("terms.generators")} ({profile.generators.length}
                            ):
                          </Text>
                          <div className="pf-v5-u-mt-xs">
                            {getGeneratorNames(profile.generators).map(
                              (name, i) => (
                                <Label
                                  key={i}
                                  className="pf-v5-u-mr-xs pf-v5-u-mb-xs"
                                >
                                  {name}
                                </Label>
                              )
                            )}
                            {profile.generators.length === 0 && (
                              <Text className="pf-v5-u-color-200">
                                {t("terms.none")}
                              </Text>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                    {index < profiles.length - 1 && <Divider />}
                  </StackItem>
                ))}
              </Stack>
            ) : (
              <Text component="p" className="pf-v5-u-color-200">
                {t("terms.loading")}...
              </Text>
            )}
          </CardBody>
        </Card>
      </FormGroup>

      <TargetProfileForm
        isOpen={isFormOpen}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingProfile(undefined);
        }}
        onSave={handleSaveProfile}
        initialProfile={editingProfile}
        existingNames={existingNames}
      />

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
        onCancel={() => setProfileToDelete(undefined)}
        onClose={() => setProfileToDelete(undefined)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
