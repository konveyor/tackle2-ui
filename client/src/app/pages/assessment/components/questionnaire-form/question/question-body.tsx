import * as React from "react";
import { FlexItem } from "@patternfly/react-core";

export interface QuestionBodyProps {
  children?: React.ReactNode;
}

export const QuestionBody: React.FC<QuestionBodyProps> = ({
  children = null,
}) => {
  return <FlexItem>{children}</FlexItem>;
};
