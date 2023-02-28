import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "./item";
interface SortableItemProps {
  style?: React.CSSProperties;
  id: number;
  onEdit?: () => void;
  onDelete?: () => void;
}
export const SortableItem: React.FC<SortableItemProps> = (
  { style, id, onEdit, onDelete },
  ...props
) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id: id });

  const inlineStyles = {
    transform: CSS.Transform.toString(transform),
    transition: [transition].filter(Boolean).join(", "),
    height: 410,
    width: "20em",
    ...style,
  } as React.CSSProperties;

  return (
    <Item
      ref={setNodeRef}
      style={inlineStyles}
      handleProps={{
        ref: setActivatorNodeRef,
        listeners: listeners,
        attributes: attributes,
      }}
      onEdit={onEdit}
      onDelete={onDelete}
      {...props}
      id={id}
    />
  );
};
