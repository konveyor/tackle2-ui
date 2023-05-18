import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { useFetchRulesets } from "@app/queries/rulesets";

interface ItemProps {
  id: number;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
  handleProps?: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const Item: React.FC<ItemProps> = forwardRef(
  ({ id, style, ...props }, ref) => {
    const { rulesets } = useFetchRulesets();
    const matchingRuleset = rulesets.find((Ruleset) => Ruleset.id === id);
    const inlineStyles = {
      height: 400,
      width: "20em",
      ...style,
    } as React.CSSProperties;
    return (
      <div ref={ref} style={inlineStyles}>
        {matchingRuleset && (
          <TargetCard
            item={matchingRuleset}
            handleProps={props.handleProps}
            onEdit={props.onEdit}
            onDelete={props.onDelete}
          />
        )}
      </div>
    );
  }
);
