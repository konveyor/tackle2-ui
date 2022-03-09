import React from "react";
import {
  Title,
  Stack,
  StackItem,
  TextContent,
  Text,
} from "@patternfly/react-core";

import { SelectCardGallery } from "./components/select-card-gallery";
import { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { IFormValues } from "./analysis-wizard";

interface IAnalysisMode {
  getValues: UseFormGetValues<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
}

export const SetTargets: React.FunctionComponent<IAnalysisMode> = ({
  getValues,
  setValue,
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
            values={getValues("targets")}
            onChange={(value) => {
              setValue("targets", value);
            }}
          />
        </StackItem>
      </Stack>{" "}
    </>
  );
};
