import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { transformationTargets } from "@app/data/targets";
interface ItemProps {
  style?: React.CSSProperties;
  id: string;
  ref?: React.ForwardedRef<any>;
}
export const Item: React.FC<ItemProps> = forwardRef(
  ({ id, style, ...props }, ref) => {
    const matchingTarget = transformationTargets.find(
      (target) => target.name === id
    );
    const inlineStyles = {
      height: 400,
      ...style,
    } as React.CSSProperties;

    return (
      <div {...props} ref={ref} style={inlineStyles}>
        {matchingTarget && <TargetCard item={matchingTarget}></TargetCard>}
      </div>
    );
  }
);
