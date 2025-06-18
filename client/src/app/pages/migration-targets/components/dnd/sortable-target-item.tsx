import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Target } from "@app/api/models";
import { TargetItem } from "./target-item";

interface SortableTargetItemProps {
  style?: React.CSSProperties;
  target: Target;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SortableTargetItem: React.FC<SortableTargetItemProps> = ({
  style,
  target,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id: target.id });

  const itemStyles = {
    transform: CSS.Transform.toString(transform),
    transition: [transition].filter(Boolean).join(", "),
    ...style,
  } as React.CSSProperties;

  return (
    <TargetItem
      ref={setNodeRef}
      style={itemStyles}
      onEdit={onEdit}
      onDelete={onDelete}
      target={target}
      activatorNodeRef={setActivatorNodeRef}
      {...attributes}
      {...listeners}
    />
  );
};
