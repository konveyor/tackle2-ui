import * as React from "react";
import { Tag, TagCategory } from "@app/api/models";
import { COLOR_HEX_VALUES_BY_NAME } from "@app/Constants";
import { LabelCustomColor } from "@app/components/LabelCustomColor";

export const getTagCategoryFallbackColor = (category?: TagCategory | null) => {
  if (!category?.id) return COLOR_HEX_VALUES_BY_NAME.gray;
  const colorValues = Object.values(COLOR_HEX_VALUES_BY_NAME);
  return colorValues[category?.id % colorValues.length];
};

export interface ItemTagLabelProps {
  tag: Tag;
  category?: TagCategory;
  className?: string;
}

export const ItemTagLabel: React.FC<ItemTagLabelProps> = ({
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
