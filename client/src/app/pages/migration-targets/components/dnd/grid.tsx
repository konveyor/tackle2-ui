import React from "react";
interface DndGridProps {
  children: React.ReactNode;
  columns: number;
}
export const DndGrid: React.FC<DndGridProps> = ({
  children,
  columns,
}: DndGridProps) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 20em)`,
        gridGap: 20,
        padding: 20,
      }}
    >
      {children}
    </div>
  );
};
