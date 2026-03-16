import * as React from "react";

export interface ConditionalRenderProps {
  when: boolean;
  then: React.ReactNode;
  children: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  when,
  then,
  children,
}) => {
  return when ? then : children || <></>;
};
