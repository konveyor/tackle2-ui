import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { useFetchMigrationTargets } from "@app/queries/rulesets";
import "./dnd.css";

interface ItemProps {
  id: string;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
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
      <div className="grabbable" {...props} ref={ref} style={inlineStyles}>
        {matchingTarget && (
          <TargetCard item={matchingTarget} isEditable={true}></TargetCard>
        )}
      </div>
    );
  }
);
