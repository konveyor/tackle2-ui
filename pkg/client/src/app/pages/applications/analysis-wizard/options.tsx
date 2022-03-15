import * as React from "react";
import {
  Button,
  Form,
  FormGroup,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextArea,
  TextContent,
  Title,
} from "@patternfly/react-core";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

interface IOptions {
  targets: string[];
  sources: string[];
}

export const Options: React.FunctionComponent<IOptions> = ({
  targets,
  sources,
}) => {
  React.useState(false);

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);

  const [selectedTargets, setSelectedTargets] = React.useState<string[]>([]);
  const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
  const [excludedRulesTags, setExcludedRulesTags] = React.useState<string[]>(
    []
  );

  const [rulesToExclude, setRulesToExclude] = React.useState("");

  const targetsOptions = targets.map((target, index) => {
    return <SelectOption key={index} component="button" value={target} />;
  });

  const sourcesOptions = sources.map((source, index) => {
    return <SelectOption key={index} component="button" value={source} />;
  });

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Advanced options
        </Title>
        <Text>Specify additional options here.</Text>
      </TextContent>
      <Form isHorizontal>
        <FormGroup label="Targets" fieldId="targets">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select targets"
            selections={selectedTargets}
            isOpen={isSelectTargetsOpen}
            onSelect={(_, selection) => {
              if (!selectedTargets.includes(selection as string))
                setSelectedTargets([...selectedTargets, selection] as string[]);
              else
                setSelectedTargets(
                  selectedTargets.filter((target) => target !== selection)
                );
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onToggle={() => {
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onClear={() => {
              setSelectedTargets([]);
            }}
          >
            {targetsOptions}
          </Select>
        </FormGroup>
        <FormGroup label="Sources" fieldId="sources">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={selectedSources}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              if (!selectedSources.includes(selection as string))
                setSelectedSources([...selectedSources, selection] as string[]);
              else
                setSelectedSources(
                  selectedSources.filter((source) => source !== selection)
                );
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onToggle={() => {
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onClear={() => {
              setSelectedSources([]);
            }}
          >
            {sourcesOptions}
          </Select>
        </FormGroup>
        <FormGroup label="Excluded rules tags" fieldId="excluded-rules">
          <InputGroup>
            <TextArea
              name="included-packages"
              id="included-packages"
              aria-label="Packages to include"
              value={rulesToExclude}
              onChange={(value) => setRulesToExclude(value)}
            />
            <Button
              id="add-to-included-packages-list"
              variant="control"
              onClick={() => {
                const list = rulesToExclude.split(",");
                setExcludedRulesTags([...new Set(list)]);
                setRulesToExclude("");
              }}
            >
              Add
            </Button>
          </InputGroup>
          <div className={spacing.ptMd}>
            {excludedRulesTags.map((pkg, index) => (
              <div key={index}>
                <InputGroup key={index}>
                  <Text className="package">{pkg}</Text>
                  <Button
                    isInline
                    id="remove-from-excluded-rules-tags"
                    variant="control"
                    icon={<DelIcon />}
                    onClick={() =>
                      setExcludedRulesTags(
                        excludedRulesTags.filter((p) => p !== pkg)
                      )
                    }
                  />
                </InputGroup>
              </div>
            ))}
          </div>
        </FormGroup>
      </Form>
    </>
  );
};
