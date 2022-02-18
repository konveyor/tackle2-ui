import React from "react";
import { StackItem } from "@patternfly/react-core";

export interface QuestionHeaderProps {
  children?: React.ReactNode;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  children = null,
}) => {
  return <StackItem className="pf-u-pb-sm">{children}</StackItem>;
};
