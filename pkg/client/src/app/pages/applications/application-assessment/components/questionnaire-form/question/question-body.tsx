import React from "react";
import { StackItem } from "@patternfly/react-core";

export interface QuestionBodyProps {
  children?: React.ReactNode;
}

export const QuestionBody: React.FC<QuestionBodyProps> = ({
  children = null,
}) => {
  return <StackItem>{children}</StackItem>;
};
