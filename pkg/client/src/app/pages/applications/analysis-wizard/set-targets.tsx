import React from "react";
import {
  Title,
  Stack,
  StackItem,
  TextContent,
  TitleSizes,
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
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Title headingLevel="h5" size={TitleSizes["lg"]}>
            Set targets
          </Title>
          <Text component="small">
            Select one or more target options in focus for the analysis.
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <SelectCardGallery
          value={getValues("targets")}
          onChange={(value) => {
            setValue("targets", value);
          }}
        />
      </StackItem>
    </Stack>
  );
};
