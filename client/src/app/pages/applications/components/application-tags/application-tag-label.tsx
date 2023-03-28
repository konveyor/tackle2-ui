import * as React from "react";
import { Tag, TagCategory } from "@app/api/models";
import { LabelCustomColor } from "@migtools/lib-ui";
import {
  global_palette_black_1000 as black,
  global_palette_black_500 as gray,
  global_palette_blue_300 as blue,
  global_palette_green_300 as green,
  global_palette_cyan_300 as cyan,
  global_palette_purple_600 as purple,
  global_palette_gold_300 as gold,
  global_palette_orange_300 as orange,
} from "@patternfly/react-tokens";

// Colors from https://sashamaps.net/docs/resources/20-colors/ with some colors removed for being too bright
export const TAG_COLORS = {
  red: "#D95F55", // (PF red is weird because 100 is too close to Maroon and 50 is too bright)
  green: green.value,
  gold: gold.value,
  blue: blue.value,
  orange: orange.value,
  purple: purple.value,
  cyan: cyan.value,
  magenta: "#F032E6",
  lime: "#BFEF45",
  teal: "#469990",
  brown: "#9A6324",
  maroon: "#800000",
  olive: "#808000",
  navy: "#000075",
  gray: gray.value,
  black: black.value,
};

const getCategoryFallbackColor = (category?: TagCategory) => {
  if (!category?.id) return TAG_COLORS.gray;
  const colorValues = Object.values(TAG_COLORS);
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
    color={category?.colour || getCategoryFallbackColor(category)}
    className={className}
  >
    {tag.name}
  </LabelCustomColor>
);
