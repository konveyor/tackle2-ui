import React from "react";
import { Label, LabelGroup } from "@patternfly/react-core";

import type { Archetype } from "@app/api/models";

// TODO: Don't show the full name, generate initials
// TODO: Sort individual stakeholders with stakeholder groups
// TODO: Add tooltips for each Label with the full name
const ArchetypeMaintainersColumn: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => (
  <LabelGroup>
    {archetype.stakeholders?.map((sh) => (
      <Label key={sh.id}>{sh.name}</Label>
    ))}
    {archetype.stakeholderGroups?.map((shg) => (
      <Label key={shg.id}>{shg.name}</Label>
    ))}
  </LabelGroup>
);

export default ArchetypeMaintainersColumn;
