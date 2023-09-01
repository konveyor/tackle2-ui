import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@patternfly/react-core";

import type { Archetype } from "@app/api/models";

// TODO: When count > 0 render a link to navigate to the application inventory assessment page
//       with filters set to show the applications for the archetype?
const ArchetypeApplicationsColumn: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => {
  const { t } = useTranslation();

  return (archetype?.applications?.length ?? 0) > 0 ? (
    <Text>
      {t("message.archetypeApplicationCount", {
        count: archetype.applications?.length ?? 0,
      })}
    </Text>
  ) : (
    <Text>{t("message.archetypeNoApplications")}</Text>
  );
};

export default ArchetypeApplicationsColumn;
