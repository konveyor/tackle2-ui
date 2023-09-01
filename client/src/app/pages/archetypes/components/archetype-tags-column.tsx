import React from "react";
import { LabelGroup } from "@patternfly/react-core";
import { LabelCustomColor } from "@migtools/lib-ui";

import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import type { Archetype, TagCategory, Tag } from "@app/api/models";

// copied from application-tag-label.tsx
export const getTagCategoryFallbackColor = (category?: TagCategory) => {
  if (!category?.id) return COLOR_HEX_VALUES_BY_NAME.gray;
  const colorValues = Object.values(COLOR_HEX_VALUES_BY_NAME);
  return colorValues[category?.id % colorValues.length];
};

// copied from application-tag-label.tsx
const TagLabel: React.FC<{
  tag: Tag;
  category?: TagCategory;
}> = ({ tag, category }) => (
  <LabelCustomColor
    color={category?.colour || getTagCategoryFallbackColor(category)}
  >
    {tag.name}
  </LabelCustomColor>
);

// TODO: Refactor the application-tags-label.tsx so applications and archetypes can share `TagLabel`
// TODO: Sort tags?
// TODO: Group tags by categories?
const ArchetypeTagsColumn: React.FC<{ archetype: Archetype }> = ({
  archetype,
}) => (
  <LabelGroup>
    {archetype.archetypeTags?.map((tag) => <TagLabel key={tag.id} tag={tag} />)}
  </LabelGroup>
);

export default ArchetypeTagsColumn;
