import * as React from "react";
import {
  Button,
  InputGroup,
  List,
  ListItem,
  Radio,
  Stack,
  StackItem,
  Switch,
  Text,
  TextArea,
  TextContent,
  Title,
  TitleSizes,
} from "@patternfly/react-core";
import { FormState, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { IFormValues } from "./analysis-wizard";
interface IScope {
  getValues: UseFormGetValues<IFormValues>;
  setValue: UseFormSetValue<IFormValues>;
}

export const Scope: React.FunctionComponent<IScope> = ({
  getValues,
  setValue,
}) => {
  const { scope } = getValues();
  const [packagesToInclude, setPackagesToInclude] = React.useState("");
  const [includedPackages, setIncludedPackages] = React.useState([""]);

  const [excludedSwitch, setExcludedSwitch] = React.useState(false);
  const [packagesToExclude, setPackagesToExclude] = React.useState("");
  const [excludedPackages, setExcludedPackages] = React.useState([""]);

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Title headingLevel="h5" size={TitleSizes["lg"]}>
            Scope
          </Title>
          <Text component="small">
            Select the scope of dependencies you want to include in the
            analysis.
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Radio
          id="deps-only"
          name="deps"
          isChecked={scope === "depsOnly"}
          onChange={() => {
            setValue("scope", "depsOnly");
          }}
          label="Application and internal dependencies only"
          className={spacing.mbXs}
        />
      </StackItem>
      <StackItem>
        <Radio
          id="deps-all"
          name="deps"
          isChecked={scope === "depsAll"}
          onChange={() => {
            setValue("scope", "depsAll");
          }}
          label="Application and all dependencies, including known Open Source libraries"
          className={spacing.mbXs}
        />
      </StackItem>
      <StackItem>
        <Radio
          id="deps-select"
          name="deps"
          isChecked={scope === "depsSelect"}
          onChange={() => {
            setValue("scope", "depsSelect");
          }}
          label="Select the list of packages to be analyzed manually"
          className={spacing.mbXs}
        />
      </StackItem>
      {scope === "depsSelect" && (
        <>
          <StackItem>
            <InputGroup>
              <TextArea
                name="included-packages"
                id="included-packages"
                aria-label="Packages to include"
                value={packagesToInclude}
                onChange={(value) => setPackagesToInclude(value)}
              />
              <Button
                id="add-to-included-packages-list"
                variant="control"
                onClick={() => {
                  const list = packagesToInclude.split(",");
                  setIncludedPackages([...new Set(list)]);
                  setPackagesToInclude("");
                }}
              >
                Add
              </Button>
            </InputGroup>
          </StackItem>
          {includedPackages && (
            <StackItem>
              <List isPlain isBordered>
                {includedPackages.map(
                  (pkg, index) =>
                    pkg && (
                      <ListItem key={index}>
                        {pkg}
                        <Button
                          id="remove-from-packages-included"
                          variant="control"
                          icon={<DelIcon />}
                          onClick={() =>
                            setIncludedPackages(
                              includedPackages.filter((p) => p !== pkg)
                            )
                          }
                        />
                      </ListItem>
                    )
                )}
              </List>
            </StackItem>
          )}
          <Switch
            id="simple-switch"
            label="Exclude packages"
            isChecked={excludedSwitch}
            onChange={() => setExcludedSwitch(!excludedSwitch)}
          />
        </>
      )}
      {excludedSwitch && (
        <>
          <StackItem>
            <InputGroup>
              <TextArea
                name="excluded-packages"
                id="excluded-packages"
                aria-label="Packages to exclude"
                value={packagesToExclude}
                onChange={(value) => setPackagesToExclude(value)}
              />
              <Button
                id="add-to-excluded-packages-list"
                variant="control"
                onClick={() => {
                  const list = packagesToExclude.split(",");
                  setExcludedPackages([...new Set(list)]);
                  setPackagesToExclude("");
                }}
              >
                Add
              </Button>
            </InputGroup>
          </StackItem>
          {excludedPackages && (
            <StackItem>
              <List isPlain isBordered>
                {excludedPackages.map(
                  (pkg, index) =>
                    pkg && (
                      <ListItem key={index}>
                        {pkg}
                        <Button
                          id="remove-from-packages-excluded"
                          variant="control"
                          icon={<DelIcon />}
                          onClick={() =>
                            setExcludedPackages(
                              excludedPackages.filter((p) => p !== pkg)
                            )
                          }
                        />
                      </ListItem>
                    )
                )}
              </List>
            </StackItem>
          )}
        </>
      )}
    </Stack>
  );
};
