import * as React from "react";
import {
  Button,
  Form,
  InputGroup,
  Radio,
  Switch,
  Text,
  TextArea,
  Title,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import "./wizard.css";

export const SetScope: React.FunctionComponent = () => {
  const { getValues, setValue } = useFormContext();

  const withKnown: string = getValues("withKnown");
  const includedPackages: string[] = getValues("includedPackages");
  const excludedPackages: string[] = getValues("excludedPackages");

  const [excludedSwitch, setExcludedSwitch] = React.useState(false);
  const [packagesToInclude, setPackagesToInclude] = React.useState("");
  const [packagesToExclude, setPackagesToExclude] = React.useState("");

  return (
    <Form>
      <Title headingLevel="h3" size="xl">
        Scope
      </Title>
      <Text>
        Select the scope of dependencies you want to include in the analysis.
      </Text>
      <Radio
        id="deps-only"
        name="deps-only"
        isChecked={withKnown === "depsOnly"}
        onChange={() => {
          setValue("withKnown", "depsOnly");
        }}
        label="Application and internal dependencies only"
        className={spacing.mbXs}
      />
      <Radio
        id="deps-all"
        name="deps-all"
        isChecked={withKnown === "depsAll"}
        onChange={() => {
          setValue("withKnown", "depsAll");
        }}
        label="Application and all dependencies, including known Open Source libraries"
        className={spacing.mbXs}
      />
      <Radio
        id="deps-select"
        name="deps-select"
        isChecked={withKnown === "depsSelect"}
        onChange={() => {
          setValue("withKnown", "depsSelect");
        }}
        label="Select the list of packages to be analyzed manually"
        className={spacing.mbXs}
      />
      {withKnown === "depsSelect" && (
        <>
          <InputGroup className={`${spacing.mtMd} ${spacing.plLg}`}>
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
                setValue("includedPackages", [...new Set(list)]);
                setPackagesToInclude("");
              }}
            >
              Add
            </Button>
          </InputGroup>
          {includedPackages && (
            <div className={spacing.plLg}>
              {includedPackages.map(
                (pkg, index) =>
                  pkg && (
                    <InputGroup key={index}>
                      <Text className="package">{pkg}</Text>
                      <Button
                        isInline
                        id="remove-from-packages-included"
                        variant="control"
                        icon={<DelIcon />}
                        onClick={() =>
                          setValue(
                            "includedPackages",
                            includedPackages.filter((p) => p !== pkg)
                          )
                        }
                      />
                    </InputGroup>
                  )
              )}
            </div>
          )}
        </>
      )}
      <>
        <Switch
          id="simple-switch"
          label="Exclude packages"
          isChecked={excludedSwitch}
          onChange={() => setExcludedSwitch(!excludedSwitch)}
        />
        {excludedSwitch && (
          <InputGroup className={`${spacing.mtMd} ${spacing.plLg}`}>
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
                setValue("excludedPackages", [...new Set(list)]);
                setPackagesToExclude("");
              }}
            >
              Add
            </Button>
          </InputGroup>
        )}
        {excludedPackages && (
          <div className={spacing.plLg}>
            {excludedPackages.map(
              (pkg, index) =>
                pkg && (
                  <div key={index}>
                    <InputGroup key={index}>
                      <Text className="package">{pkg}</Text>
                      <Button
                        isInline
                        id="remove-from-packages-excluded"
                        variant="control"
                        icon={<DelIcon />}
                        onClick={() =>
                          setValue(
                            "excludedPackages",
                            excludedPackages.filter((p) => p !== pkg)
                          )
                        }
                      />
                    </InputGroup>
                  </div>
                )
            )}
          </div>
        )}
      </>
    </Form>
  );
};
