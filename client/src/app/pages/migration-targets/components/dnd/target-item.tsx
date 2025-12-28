import * as React from "react";
import { Button, ButtonVariant } from "@patternfly/react-core";
import { GripVerticalIcon } from "@patternfly/react-icons";

import { Target } from "@app/api/models";
import { TargetCard } from "@app/components/target-card/target-card";
import "./target-item.css";

interface TargetItemProps {
  target: Target;
  style?: React.CSSProperties;
  readOnly?: boolean;
  isSelectable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  activatorNodeRef?: (element: HTMLElement | null) => void;
}

export const TargetItem = React.forwardRef<HTMLDivElement, TargetItemProps>(
  (
    {
      target,
      style,
      readOnly = false,
      isSelectable = true,
      onEdit,
      onDelete,
      activatorNodeRef,
      ...draggableProps
    },
    draggableContainerRef
  ) => {
    return (
      <div style={style} ref={draggableContainerRef}>
        <TargetCard
          item={target}
          readOnly={readOnly}
          isSelectable={isSelectable}
          dndSortHandle={
            readOnly ? undefined : (
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
            )
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }
);

TargetItem.displayName = "TargetItem";
