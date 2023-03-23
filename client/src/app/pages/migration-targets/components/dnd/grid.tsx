import React from "react";
import "./grid.css";
interface DndGridProps {
  children: React.ReactNode;
}
export const DndGrid: React.FC<DndGridProps> = ({ children }: DndGridProps) => {
  return <div className="dnd-grid columns">{children}</div>;
};
