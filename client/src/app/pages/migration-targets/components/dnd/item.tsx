import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { transformationTargets } from "@app/data/targets";
import "./dnd.css";
interface ItemProps {
  id: string;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
}
export const Item: React.FC<ItemProps> = forwardRef(
  ({ id, style, ...props }, ref) => {
    const matchingTarget = transformationTargets.find(
      (target) => target.name === id
    );
    const inlineStyles = {
      height: 400,
      width: "20em",
      ...style,
    } as React.CSSProperties;

    return (
      <div className="grabbable" {...props} ref={ref} style={inlineStyles}>
        {matchingTarget && <TargetCard item={matchingTarget}></TargetCard>}
      </div>
    );
  }
);
