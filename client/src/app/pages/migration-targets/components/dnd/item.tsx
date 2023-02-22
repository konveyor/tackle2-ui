import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/target-card";
import { useFetchRuleBundles } from "@app/queries/rulebundles";

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
    const { ruleBundles } = useFetchRuleBundles();
    const matchingRuleBundle = ruleBundles.find(
      (ruleBundle) => ruleBundle.id === id
    );
    const inlineStyles = {
      height: 400,
      width: "20em",
      ...style,
    } as React.CSSProperties;
    return (
      <div ref={ref} style={inlineStyles}>
        {matchingRuleBundle && (
          <TargetCard
            item={matchingRuleBundle}
            handleProps={props.handleProps}
            onEdit={props.onEdit}
            onDelete={props.onDelete}
          />
        )}
      </div>
    );
  }
);
