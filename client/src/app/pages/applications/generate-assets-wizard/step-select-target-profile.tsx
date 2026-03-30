import * as React from "react";
import { useTranslation } from "react-i18next";
import { Content } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Archetype, TargetProfile } from "@app/api/models";
import { intersection } from "@app/utils/utils";

import { DecoratedApplication } from "../useDecoratedApplications";

export interface TargetProfileState {
  selectedProfile?: TargetProfile;
  isValid: boolean;
}

const useCommonTargetProfiles = (applications: DecoratedApplication[]) => {
  const commonArchetypes = React.useMemo(
    () =>
      intersection(
        applications.map((app) => app.direct.archetypes).filter(Boolean),
        (a, b) => a.id === b.id
      ),
    [applications]
  );

  const availableProfiles = React.useMemo(
    () =>
      commonArchetypes.reduce(
        (acc, archetype) => {
          archetype.profiles?.forEach((profile) => {
            acc.push({ archetype, profile });
          });
          return acc;
        },
        [] as { archetype: Archetype; profile: TargetProfile }[]
      ),
    [commonArchetypes]
  );

  return {
    commonArchetypes,
    availableProfiles,
  };
};

export const SelectTargetProfile: React.FC<{
  applications: DecoratedApplication[];
  onTargetProfileChanged: (profile: TargetProfile) => void;
  initialTargetProfile?: TargetProfile;
}> = ({ applications, onTargetProfileChanged, initialTargetProfile }) => {
  const { t } = useTranslation();
  const { availableProfiles } = useCommonTargetProfiles(applications);

  const [selectedProfile, setSelectedProfile] = React.useState<
    TargetProfile | undefined
  >(initialTargetProfile);

  const onChangeSelection = (profile: TargetProfile) => {
    setSelectedProfile(profile);
    onTargetProfileChanged(profile);
  };

  return (
    <div>
      <Content style={{ marginBottom: "var(--pf-v5-global--spacer--lg)" }}>
        <Content component="h3">
          {t("generateAssetsWizard.selectTargetProfile.title")}
        </Content>
        <Content component="p">
          {t("generateAssetsWizard.selectTargetProfile.description", {
            count: applications.length,
            first: applications?.[0].name ?? "",
          })}
        </Content>
      </Content>

      {availableProfiles.length === 0 ? (
        <div style={{ padding: "20px" }}>
          <Content component="p">
            {t("generateAssetsWizard.selectTargetProfile.noProfilesAvailable")}
          </Content>
        </div>
      ) : (
        <Table aria-label="available target profiles">
          <Thead>
            <Tr>
              <Th screenReaderText="row select" />
              <Th>
                {t("generateAssetsWizard.selectTargetProfile.columnArchetype")}
              </Th>
              <Th>
                {t(
                  "generateAssetsWizard.selectTargetProfile.columnTargetPlatform"
                )}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {availableProfiles.map(({ archetype, profile }, index) => (
              <Tr
                key={`${archetype.id}-${profile.id}`}
                isClickable
                onClick={() => onChangeSelection(profile)}
              >
                <Td
                  select={{
                    rowIndex: index,
                    onSelect: () => onChangeSelection(profile),
                    isSelected: selectedProfile?.id === profile.id,
                    variant: "radio",
                  }}
                />
                <Td>{archetype.name}</Td>
                <Td>{profile.name}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
};
