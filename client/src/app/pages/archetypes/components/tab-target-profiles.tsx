import React from "react";
import { useTranslation } from "react-i18next";
import {
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  Bullseye,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { CubesIcon } from "@patternfly/react-icons";
import { Archetype } from "@app/api/models";
import { Table, Tr, Th, Thead, Tbody, Td } from "@patternfly/react-table";
import { LabelsFromItems } from "@app/components/labels/labels-from-items/labels-from-items";
import { DrawerTabContent } from "@app/components/detail-drawer";

export interface TabTargetProfilesProps {
  archetype: Archetype;
}

export const TabTargetProfiles: React.FC<TabTargetProfilesProps> = ({
  archetype,
}) => {
  const { t } = useTranslation();
  const profiles = archetype?.profiles || [];

  if (profiles.length === 0) {
    return (
      <Bullseye>
        <EmptyState>
          <EmptyStateHeader
            headingLevel="h4"
            titleText={t("message.noTargetProfilesTitle")}
            icon={<EmptyStateIcon icon={CubesIcon} />}
          />
          <EmptyStateBody>
            {t("message.noTargetProfilesDescription")}
          </EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <DrawerTabContent>
      <Table
        aria-label="Target profiles"
        className={spacing.mtMd}
        variant="compact"
      >
        <Thead>
          <Tr>
            <Th>{t("terms.name")}</Th>
            <Th>{t("terms.generators")}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {profiles.map((profile) => (
            <Tr key={profile.id}>
              <Td width={40}>{profile.name}</Td>
              <Td width={60}>
                <LabelsFromItems items={profile.generators} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </DrawerTabContent>
  );
};
