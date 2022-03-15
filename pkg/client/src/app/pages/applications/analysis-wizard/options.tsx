import * as React from "react";
import {
  Form,
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  Title,
} from "@patternfly/react-core";

interface IOptions {
  targets: string[];
}

export const Options: React.FunctionComponent<IOptions> = ({ targets }) => {
  React.useState(false);

  const [isTargetsSelectOpen, setTargetsSelectOpen] = React.useState(false);

  const targetsOptions = targets.map((target, index) => {
    return <SelectOption key={index} component="button" value={target} />;
  });

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Advanced options
        </Title>
        <Text>Specify additional options here.</Text>
      </TextContent>
      <Form>
        <FormGroup label="Target(s)" isRequired fieldId="targets">
          <Select
            variant={SelectVariant.single}
            aria-label="Select user perspective"
            selections={targets}
            isOpen={isTargetsSelectOpen}
            onSelect={(_, selection) => {
              // setMode(selection as string);
              setTargetsSelectOpen(!isTargetsSelectOpen);
            }}
            onToggle={() => {
              setTargetsSelectOpen(!isTargetsSelectOpen);
            }}
          >
            {targetsOptions}
          </Select>
        </FormGroup>
      </Form>
    </>
  );
};
