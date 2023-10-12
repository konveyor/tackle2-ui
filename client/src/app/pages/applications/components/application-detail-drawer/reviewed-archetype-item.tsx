import { useFetchArchetypeById } from "@app/queries/archetypes";
import { Label } from "@patternfly/react-core";
import React from "react";

export const ReviewedArchetypeItem = ({ id }: { id: number }) => {
  const { archetype } = useFetchArchetypeById(id);

  if (!archetype) return null;

  return (
    <Label color="grey" key={id}>
      {archetype.name}
      {archetype.review ? " (Reviewed)" : " (Not Reviewed)"}
    </Label>
  );
};
