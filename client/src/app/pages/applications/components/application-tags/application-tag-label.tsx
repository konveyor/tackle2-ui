import * as React from "react";
import { Tag, TagCategory } from "@app/api/models";
import { LabelCustomColor } from "@migtools/lib-ui";
import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";

export const getTagCategoryFallbackColor = (category?: TagCategory) => {
  if (!category?.id) return COLOR_HEX_VALUES_BY_NAME.gray;
  const colorValues = Object.values(COLOR_HEX_VALUES_BY_NAME);
  return colorValues[category?.id % colorValues.length];
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
    color={category?.colour || getTagCategoryFallbackColor(category)}
    className={className}
  >
    {tag.name}
  </LabelCustomColor>
);
