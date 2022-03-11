import React from "react";
import {
  Title,
  Stack,
  StackItem,
  TextContent,
  Text,
} from "@patternfly/react-core";

import { SelectCardGallery } from "./components/select-card-gallery";

interface IAnalysisMode {
  targets: string[];
  setTargets: (targets: string[]) => void;
}

export const SetTargets: React.FunctionComponent<IAnalysisMode> = ({
  targets,
  setTargets,
}) => {
  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Set targets
        </Title>
        <Text>
          Select one or more target options in focus for the analysis.
        </Text>
      </TextContent>
      <Stack>
        <StackItem>
          <SelectCardGallery
            values={targets}
            onChange={(value) => {
              setTargets(value);
            }}
          />
        </StackItem>
      </Stack>{" "}
    </>
  );
};
