import React, { forwardRef } from "react";
import { Button, ButtonVariant } from "@patternfly/react-core";
import { GripVerticalIcon } from "@patternfly/react-icons";

import { TargetCard } from "@app/components/target-card/target-card";
import { Target } from "@app/api/models";
import "./target-item.css";

interface TargetItemProps {
  target: Target;
  style?: React.CSSProperties;
  onEdit?: () => void;
  onDelete?: () => void;
  activatorNodeRef?: (element: HTMLElement | null) => void;
}

export const TargetItem = forwardRef<HTMLDivElement, TargetItemProps>(
  (
    { target, style, onEdit, onDelete, activatorNodeRef, ...draggableProps },
    draggableContainerRef
  ) => {
    return (
      <div style={style} ref={draggableContainerRef}>
        <TargetCard
          item={target}
          dndSortHandle={
            <Button
              ref={activatorNodeRef}
              className="grabbable"
              id={`target-${target.id}-drag-button`}
              aria-label={`target ${target.name} drag button`}
              variant={ButtonVariant.plain}
              {...draggableProps}
            >
              <GripVerticalIcon />
            </Button>
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }
);

TargetItem.displayName = "TargetItem";
