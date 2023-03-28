import * as React from "react";
import { Tag, TagCategory } from "@app/api/models";
import { LabelCustomColor } from "@migtools/lib-ui";

// Colors from https://sashamaps.net/docs/resources/20-colors/ with some colors removed for being too bright
const TAG_FALLBACK_COLORS = [
  "#E6194B", // Red
  "#3CB44B", // Green
  "#FFE119", // Yellow
  "#4363D8", // Blue
  "#F58231", // Orange
  "#911EB4", // Purple
  "#42D4F4", // Cyan
  "#F032E6", // Magenta
  "#BFEF45", // Lime
  "#469990", // Teal
  "#9A6324", // Brown
  "#800000", // Maroon
  "#808000", // Olive
  "#000075", // Navy
  "#A9A9A9", // Grey
  "#000000", // Black
];

const getCategoryFallbackColor = (category?: TagCategory) => {
  if (!category?.id) return "#A9A9A9"; // Grey
  return TAG_FALLBACK_COLORS[category?.id % TAG_FALLBACK_COLORS.length];
};

export interface ApplicationTagLabelProps {
  tag: Tag;
  category?: TagCategory;
  className?: string;
}

export const ApplicationTagLabel: React.FC<ApplicationTagLabelProps> = ({
  tag,
  category,
  className,
}) => (
  <LabelCustomColor
    color={category?.colour || getCategoryFallbackColor(category)}
    className={className}
  >
    {tag.name}
  </LabelCustomColor>
);
