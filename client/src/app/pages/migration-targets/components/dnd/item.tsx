import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { useFetchMigrationTargets } from "@app/queries/rulesets";
interface ItemProps {
  id: string;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
  handleProps?: any;
}

export const Item: React.FC<ItemProps> = forwardRef(
  ({ id, style, ...props }, ref) => {
    const { migrationTargets } = useFetchMigrationTargets();
    const matchingTarget = migrationTargets.find(
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
