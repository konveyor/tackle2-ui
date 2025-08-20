import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Stack,
  StackItem,
  Text,
  Label,
  Divider,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Archetype, TargetProfile } from "@app/api/models";
import { useFetchGenerators } from "@app/queries/generators";

export interface TabTargetProfilesProps {
  archetype: Archetype;
}

export const TabTargetProfiles: React.FC<TabTargetProfilesProps> = ({
  archetype,
}) => {
  const { t } = useTranslation();
  const { generators } = useFetchGenerators();

  const getGeneratorNames = useMemo(
    () => (generatorRefs: TargetProfile["generators"]) => {
      if (!generators || !generatorRefs) return [];
      return generatorRefs
        .map((ref) => generators.find((g) => g.id === ref.id)?.name)
        .filter(Boolean) as string[];
    },
    [generators]
  );

  const profiles = archetype?.profiles || [];

  if (profiles.length === 0) {
    return (
      <EmptyState>
        <EmptyStateHeader
          headingLevel="h4"
          titleText={t("message.noTargetProfilesConfigured")}
          icon={<EmptyStateIcon icon={CubesIcon} />}
        />
        <EmptyStateBody>
          {t("message.noTargetProfilesConfiguredDescription")}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Stack hasGutter>
      {profiles.map((profile, index) => (
        <StackItem key={profile.id || profile.name || index}>
          <Card isFlat>
            <CardHeader>
              <CardTitle>
                <Text component="h5">{profile.name}</Text>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div>
                <Text
                  component="small"
                  className="pf-v5-u-color-200 pf-v5-u-mb-sm"
                >
                  {t("terms.generators")} ({profile.generators.length}):
                </Text>
                <div className="pf-v5-u-mt-xs">
                  {getGeneratorNames(profile.generators).map((name, i) => (
                    <Label key={i} className="pf-v5-u-mr-xs pf-v5-u-mb-xs">
                      {name}
                    </Label>
                  ))}
                  {profile.generators.length === 0 && (
                    <Text className="pf-v5-u-color-200">{t("terms.none")}</Text>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
          {index < profiles.length - 1 && <Divider />}
        </StackItem>
      ))}
    </Stack>
  );
};
