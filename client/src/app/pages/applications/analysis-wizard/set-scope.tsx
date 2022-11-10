import * as React from "react";
import * as yup from "yup";
import { Form, Radio, Switch, Text, Title } from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useTranslation } from "react-i18next";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";
import { StringListField } from "@app/shared/components/string-list-field";

export const SetScope: React.FC = () => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();

  // For transient fields next to "Add" buttons
  const packageNameSchema = yup.string().matches(/^[a-z]+(.[a-z0-9]+)*$/, {
    message: "Must be a valid Java package name", // TODO translation here
  });

  const { hasExcludedPackages, withKnown, includedPackages, excludedPackages } =
    watch();

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Title headingLevel="h3" size="xl">
        Scope
      </Title>
      <Text>
        Select the scope of dependencies you want to include in the analysis.
      </Text>
      <Radio
        id="app"
        name="app"
        isChecked={withKnown === "app"}
        onChange={() => {
          setValue("withKnown", "app");
        }}
        label={t("wizard.label.scopeInternalDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="oss"
        name="oss"
        isChecked={withKnown === "app,oss"}
        onChange={() => {
          setValue("withKnown", "app,oss");
        }}
        label={t("wizard.label.scopeAllDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="select"
        name="select"
        isChecked={withKnown === "app,oss,select"}
        onChange={() => {
          setValue("withKnown", "app,oss,select");
        }}
        label={t("wizard.label.scopeSelectDeps")}
        className="scope-select-radio-button"
        body={
          withKnown.includes("select") ? (
            <StringListField
              listItems={includedPackages}
              setListItems={(items) => setValue("includedPackages", items)}
              itemToAddSchema={packageNameSchema}
              itemToAddFieldId="packageToInclude"
              itemToAddAriaLabel="Add a package to include" // TODO translation here
              itemNotUniqueMessage="This package is already included" // TODO translation here
              removeItemButtonId={(pkg) =>
                `remove-${pkg}-from-included-packages`
              }
              className={spacing.mtMd}
            />
          ) : null
        }
      />
      <Switch
        id="excludedPackages"
        label={t("wizard.label.excludePackages")}
        isChecked={hasExcludedPackages}
        onChange={(checked) => {
          setValue("hasExcludedPackages", checked);
        }}
        className={spacing.mtMd}
      />
      {hasExcludedPackages ? (
        <StringListField
          listItems={excludedPackages}
          setListItems={(items) => setValue("excludedPackages", items)}
          itemToAddSchema={packageNameSchema}
          itemToAddFieldId="packageToExclude"
          itemToAddAriaLabel="Add a package to exclude" // TODO translation here
          itemNotUniqueMessage="This package is already excluded" // TODO translation here
          removeItemButtonId={(pkg) => `remove-${pkg}-from-excluded-packages`}
          className={`${spacing.mtSm} ${spacing.mlLg}`}
        />
      ) : null}
    </Form>
  );
};
