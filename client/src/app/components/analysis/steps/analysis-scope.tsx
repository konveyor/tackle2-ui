import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { UseFormSetValue, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { Form, Radio, Switch, Text, Title } from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { StringListField } from "@app/components/StringListField";
import { useFormChangeHandler } from "@app/hooks/useFormChangeHandler";

// Scope step
export type AnalysisScopeType = "app" | "app,oss" | "app,oss,select";

export interface AnalysisScopeValues {
  withKnownLibs: AnalysisScopeType;
  includedPackages: string[];
  hasExcludedPackages: boolean;
  excludedPackages: string[];
}

export interface AnalysisScopeState extends AnalysisScopeValues {
  isValid: boolean;
}

export const useAnalysisScopeSchema = (): yup.SchemaOf<AnalysisScopeValues> => {
  const { t } = useTranslation();
  return yup.object({
    withKnownLibs: yup
      .mixed<AnalysisScopeType>()
      .oneOf(["app", "app,oss", "app,oss,select"])
      .required(t("validation.required")),
    includedPackages: yup
      .array()
      .of(yup.string().defined())
      .when("withKnownLibs", (withKnownLibs, schema) =>
        "app,oss,select" === withKnownLibs ? schema.min(1) : schema
      ),
    hasExcludedPackages: yup.bool().defined(),
    excludedPackages: yup
      .array()
      .of(yup.string().defined())
      .when("hasExcludedPackages", (hasExcludedPackages, schema) =>
        hasExcludedPackages ? schema.min(1) : schema
      ),
  });
};

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

  useFormChangeHandler({ form, onStateChanged });
  const setValue: UseFormSetValue<AnalysisScopeValues> = React.useCallback(
    (name, value) => {
      form.setValue(name, value, { shouldValidate: true });
    },
    [form]
  );

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
          setValue("withKnownLibs", "app");
        }}
        label={t("wizard.label.scopeInternalDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="oss"
        name="oss"
        isChecked={withKnownLibs === "app,oss"}
        onChange={() => {
          setValue("withKnownLibs", "app,oss");
        }}
        label={t("wizard.label.scopeAllDeps")}
        className={spacing.mbXs}
      />
      <Radio
        id="select"
        name="select"
        isChecked={withKnownLibs === "app,oss,select"}
        onChange={() => {
          setValue("withKnownLibs", "app,oss,select");
        }}
        label={t("wizard.label.scopeSelectDeps")}
        className="scope-select-radio-button"
        body={
          withKnownLibs?.includes("select") ? (
            <StringListField
              listItems={includedPackages ?? []}
              setListItems={(items) => setValue("includedPackages", items)}
              itemToAddSchema={packageNameSchema}
              itemToAddFieldId="packageToInclude"
              itemToAddAriaLabel={t("wizard.label.packageToInclude")}
              itemNotUniqueMessage={t("wizard.label.packageIncluded")}
              removeItemButtonId={(pkg) =>
                `remove-${pkg}-from-included-packages`
              }
              addButtonId="add-package-to-include"
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
          setValue("hasExcludedPackages", checked);
        }}
        className={spacing.mtMd}
      />
      {hasExcludedPackages ? (
        <StringListField
          listItems={excludedPackages ?? []}
          setListItems={(items) => setValue("excludedPackages", items)}
          itemToAddSchema={packageNameSchema}
          itemToAddFieldId="packageToExclude"
          itemToAddAriaLabel={t("wizard.label.packageToExclude")}
          itemNotUniqueMessage={t("wizard.label.packageExcluded")}
          removeItemButtonId={(pkg) => `remove-${pkg}-from-excluded-packages`}
          addButtonId="add-package-to-exclude"
          className={`${spacing.mtSm} ${spacing.mlLg}`}
        />
      ) : null}
    </Form>
  );
};
