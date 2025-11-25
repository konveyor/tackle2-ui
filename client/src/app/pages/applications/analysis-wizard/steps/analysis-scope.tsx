import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Form, Radio, Switch, Text, Title } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { StringListField } from "@app/components/StringListField";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";

import {
  AnalysisScopeState,
  AnalysisScopeValues,
  useAnalysisScopeSchema,
} from "../schema";

interface AnalysisScopeProps {
  onStateChanged: (state: AnalysisScopeState) => void;
  initialState: AnalysisScopeState;
}

export const AnalysisScope: React.FC<AnalysisScopeProps> = ({
  onStateChanged,
  initialState,
}) => {
  const { t } = useTranslation();

  // For transient fields next to "Add" buttons
  const packageNameSchema = yup.string().matches(/^[a-z]+(.[a-z0-9]+)*$/, {
    message: "Must be a valid Java package name",
  });

  const schema = useAnalysisScopeSchema();
  const form = useForm<AnalysisScopeValues>({
    defaultValues: {
      withKnownLibs: initialState.withKnownLibs,
      includedPackages: initialState.includedPackages,
      hasExcludedPackages: initialState.hasExcludedPackages,
      excludedPackages: initialState.excludedPackages,
    },
    resolver: yupResolver(schema),
    mode: "all",
  });

  useFormChangeHandler({
    form,
    onStateChanged,
    watchFields: [
      "withKnownLibs",
      "includedPackages",
      "hasExcludedPackages",
      "excludedPackages",
    ] as const,
    mapValuesToState: (
      [withKnownLibs, includedPackages, hasExcludedPackages, excludedPackages],
      isValid
    ) => ({
      withKnownLibs,
      includedPackages,
      hasExcludedPackages,
      excludedPackages,
      isValid,
    }),
  });

  const {
    withKnownLibs,
    includedPackages,
    hasExcludedPackages,
    excludedPackages,
  } = useWatch({ control: form.control });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Title headingLevel="h3" size="xl">
        Scope
      </Title>
      <Text>{t("wizard.label.scope")}</Text>

      <Radio
        id="app"
        name="app"
        isChecked={withKnownLibs === "app"}
        onChange={() => {
          form.setValue("withKnownLibs", "app");
        }}
        label={t("wizard.label.scopeInternalDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="oss"
        name="oss"
        isChecked={withKnownLibs === "app,oss"}
        onChange={() => {
          form.setValue("withKnownLibs", "app,oss");
        }}
        label={t("wizard.label.scopeAllDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="select"
        name="select"
        isChecked={withKnownLibs === "app,oss,select"}
        onChange={() => {
          form.setValue("withKnownLibs", "app,oss,select");
        }}
        label={t("wizard.label.scopeSelectDeps")}
        className="scope-select-radio-button"
        body={
          withKnownLibs?.includes("select") ? (
            <StringListField
              listItems={includedPackages ?? []}
              setListItems={(items) => form.setValue("includedPackages", items)}
              itemToAddSchema={packageNameSchema}
              itemToAddFieldId="packageToInclude"
              itemToAddAriaLabel={t("wizard.label.packageToInclude")}
              itemNotUniqueMessage={t("wizard.label.packageIncluded")}
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
        onChange={(_event, checked) => {
          form.setValue("hasExcludedPackages", checked);
        }}
        className={spacing.mtMd}
      />
      {hasExcludedPackages ? (
        <StringListField
          listItems={excludedPackages ?? []}
          setListItems={(items) => form.setValue("excludedPackages", items)}
          itemToAddSchema={packageNameSchema}
          itemToAddFieldId="packageToExclude"
          itemToAddAriaLabel={t("wizard.label.packageToExclude")}
          itemNotUniqueMessage={t("wizard.label.packageExcluded")}
          removeItemButtonId={(pkg) => `remove-${pkg}-from-excluded-packages`}
          className={`${spacing.mtSm} ${spacing.mlLg}`}
        />
      ) : null}
    </Form>
  );
};
