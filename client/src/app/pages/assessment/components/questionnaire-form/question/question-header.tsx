import * as React from "react";
import { StackItem } from "@patternfly/react-core";

export interface QuestionHeaderProps {
  children?: React.ReactNode;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  children = null,
}) => {
  return <StackItem className="pf-v5-u-pb-sm">{children}</StackItem>;
};
