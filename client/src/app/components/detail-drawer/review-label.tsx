import React from "react";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Label } from "@patternfly/react-core";
import { ReviewDrawerLabelItem } from "./review-fields";

interface ReviewLabelProps {
  item: ReviewDrawerLabelItem;
  labelText?: string | number;
}

export const ReviewLabel = ({ item, labelText }: ReviewLabelProps) => {
  return (
    <Label className={spacing.mbSm}>
      <span>
        {item.isArchetype
          ? `Archetype - ${item.name}`
          : `Application - ${item.name}` || "Unknown"}
      </span>
      <span className={spacing.mSm}>-</span>
      {labelText && <span>{labelText}</span>}
    </Label>
  );
};
