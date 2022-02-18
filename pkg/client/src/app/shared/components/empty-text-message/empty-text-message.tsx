import React from "react";
import { Text } from "@patternfly/react-core";

export interface EmptyTextMessageProps {
  message: string;
}

export const EmptyTextMessage: React.FC<EmptyTextMessageProps> = ({
  message,
}) => {
  return (
    <Text className="pf-u-color-200 pf-u-font-weight-light">
      <i>{message}</i>
    </Text>
  );
};
