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
import { UseFormSetValue } from "react-hook-form";
import { IFormValues } from "./analysis-wizard";

interface IAnalysisMode {
  setValue: UseFormSetValue<IFormValues>;
}

export const SetTargets: React.FunctionComponent<IAnalysisMode> = ({
  setValue,
}) => {
  const [selectedTargets, setSelectedTargets] = React.useState<string[]>([]);
  const [dirty, setDirty] = React.useState(false);

  const onSelectedTargetsChange = (values: string[]) => {
    setDirty(true);
    setSelectedTargets(values);
    setValue("targets", values);
  };

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
          value={selectedTargets}
          onChange={onSelectedTargetsChange}
        />
      </StackItem>
    </Stack>
  );
};
