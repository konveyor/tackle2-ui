import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "./item";
interface SortableItemProps {
  style?: React.CSSProperties;
  id: string;
}
export const SortableItem: React.FC<SortableItemProps> = (
  { style, id },
  ...props
) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const inlineStyles = {
    transform: CSS.Transform.toString(transform),
    transition: [transition].filter(Boolean).join(", "),
    height: 400,
    width: "20em",
    backgroundColor: "grey",
    ...style,
  } as React.CSSProperties;

  return (
    <Item
      ref={setNodeRef}
      style={inlineStyles}
      {...attributes}
      {...listeners}
      {...props}
      id={id}
    />
  );
};
