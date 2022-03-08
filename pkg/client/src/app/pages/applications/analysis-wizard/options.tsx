import * as React from "react";
import { Text, TextContent, Title } from "@patternfly/react-core";

interface IOptions {}

export const Options: React.FunctionComponent<IOptions> = ({}) => {
  React.useState(false);

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Advanced options
        </Title>
        <Text>Specify additional options here.</Text>
      </TextContent>
    </>
  );
};
