import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "./item";

export const SortableItem: React.FC<any> = (props: any): any => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isSorting,
    isDragging,
  } = useSortable({ id: props?.id });

  const inlineStyles = {
    transform: CSS.Transform.toString(transform),
    transition: [transition].filter(Boolean).join(", "),
    height: 400,
    backgroundColor: "grey",
    ...props.style,
  } as React.CSSProperties;

  return (
    <Item
      sorting={isSorting}
      dragging={isDragging}
      ref={setNodeRef}
      style={inlineStyles}
      {...attributes}
      {...listeners}
      {...props}
      id={props.id}
    />
  );
};
