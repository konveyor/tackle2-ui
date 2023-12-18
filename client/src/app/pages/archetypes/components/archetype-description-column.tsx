import React from "react";
import { Text, Tooltip } from "@patternfly/react-core";
import type { Archetype } from "@app/api/models";

const ArchetypeDescriptionColumn: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => {
  return (
    <Tooltip content={archetype.description}>
      <Text>{archetype.description}</Text>
    </Tooltip>
  );
};

export default ArchetypeDescriptionColumn;
