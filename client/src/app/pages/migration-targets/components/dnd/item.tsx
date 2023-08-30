import React, { forwardRef } from "react";
import { TargetCard } from "@app/components/TargetCard";
import { useFetchTargets } from "@app/queries/targets";

interface ItemProps {
  id: number;
  style?: React.CSSProperties;
  ref?: React.ForwardedRef<any>;
  handleProps?: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const Item: React.FC<ItemProps> = forwardRef(
  ({ id, style, handleProps, onEdit, onDelete }: ItemProps, ref) => {
    const { targets } = useFetchTargets();
    const matchingTarget = targets.find((target) => target.id === id);
    const inlineStyles = {
      height: 400,
      width: "20em",
      ...style,
    } as React.CSSProperties;
    return (
      <div ref={ref} style={inlineStyles}>
        {matchingTarget && (
          <TargetCard
            item={matchingTarget}
            handleProps={handleProps}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    );
  }
);

Item.displayName = "Item";
