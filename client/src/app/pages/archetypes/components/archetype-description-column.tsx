import React from "react";
import { Text } from "@patternfly/react-core";

import type { Archetype } from "@app/api/models";

// TODO: Truncate length and add tooltip with full text
const ArchetypeDescriptionColumn: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => <Text>{archetype.description}</Text>;

export default ArchetypeDescriptionColumn;
