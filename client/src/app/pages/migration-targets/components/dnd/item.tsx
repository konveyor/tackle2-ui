import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { transformationTargets } from "@app/data/targets";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
interface ItemProps {
  id: string;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
  handleProps?: any;
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
      <div ref={ref} style={inlineStyles}>
        {matchingTarget && (
          <TargetCard item={matchingTarget} handleProps={props.handleProps} />
        )}
      </div>
    );
  }
);
