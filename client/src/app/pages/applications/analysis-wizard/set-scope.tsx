import * as React from "react";
import * as yup from "yup";
import {
  Button,
  Form,
  InputGroup,
  InputGroupText,
  Radio,
  Switch,
  Text,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { useFormContext } from "react-hook-form";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";

import { getValidatedFromErrorTouched } from "@app/utils/utils";

import "./wizard.css";
import { AnalysisWizardFormValues } from "./schema";
import { HookFormPFGroupController } from "@app/shared/components/hook-form-pf-fields";

export const SetScope: React.FC = () => {
  const { t } = useTranslation();

  const { watch, setValue } = useFormContext<AnalysisWizardFormValues>();

  // For transient fields next to "Add" buttons
  const packageNameSchema = yup.string().matches(/^[a-z]+(.[a-z0-9]+)*$/, {
    excludeEmptyString: true,
    message: "Must be a valid Java package name", // TODO translation here
  });
  const includeExcludePackageForm = useForm({
    defaultValues: { packageToInclude: "", packageToExclude: "" },
    resolver: yupResolver(
      yup.object({
        packageToInclude: packageNameSchema,
        packageToExclude: packageNameSchema,
      })
    ),
    mode: "onChange",
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
          setValue("includedPackages", []); // TODO is this okay? maybe instead ignore them on submit
        }}
        label={t("wizard.label.scopeSelectDeps")}
        className={spacing.mbXs}
      />
      {withKnown.includes("select") && (
        // Probably can factor this whole group, list after it, and useForm into some kind of StringListField component
        // and use that both here and on the Options step for the excludedRulesTags field.
        // would need to pass in props for schema, field name, listValue/setListValue, ids/labels
        <>
          <HookFormPFGroupController
            control={includeExcludePackageForm.control}
            name="packageToInclude"
            fieldId="packageToInclude"
            className={`${spacing.mtMd} ${spacing.plLg}`}
            renderInput={({
              field: { name, onChange, onBlur, value, ref },
              fieldState: { isTouched, error },
            }) => (
              <InputGroup>
                <TextInput
                  ref={ref}
                  id="packageToInclude"
                  aria-label="Add a package to include" // TODO translation here
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                <Button
                  id="add-package-to-include"
                  variant="control"
                  isDisabled={!value || !!error}
                  onClick={() => {
                    setValue("includedPackages", [...includedPackages, value]);
                    includeExcludePackageForm.resetField(name);
                  }}
                >
                  {t("terms.add")}
                </Button>
              </InputGroup>
            )}
          />
          {includedPackages.length > 0 && (
            <div className={spacing.plLg}>
              {includedPackages.map(
                (pkg, index) =>
                  pkg && (
                    <InputGroup key={index}>
                      <InputGroupText className="package">{pkg}</InputGroupText>
                      <Button
                        isInline
                        id={`remove-${pkg}-from-packages-included`}
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
          id="excludedPackages"
          label={t("wizard.label.excludePackages")}
          isChecked={hasExcludedPackages}
          onChange={(checked) => {
            setValue("hasExcludedPackages", checked);
            if (!checked) {
              setValue("excludedPackages", []); // TODO is this okay? maybe instead ignore them on submit
            }
          }}
        />
        {hasExcludedPackages && (
          <HookFormPFGroupController
            control={includeExcludePackageForm.control}
            name="packageToExclude"
            fieldId="packageToExclude"
            className={`${spacing.mtMd} ${spacing.plLg}`}
            renderInput={({
              field: { name, onChange, onBlur, value, ref },
              fieldState: { isTouched, error },
            }) => (
              <InputGroup>
                <TextInput
                  ref={ref}
                  id="packageToExclude"
                  aria-label="Add a package to exclude" // TODO translation here
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
                <Button
                  id="add-package-to-exclude"
                  variant="control"
                  isDisabled={!value || !!error}
                  onClick={() => {
                    setValue("excludedPackages", [...excludedPackages, value]);
                    includeExcludePackageForm.resetField(name);
                  }}
                >
                  {t("terms.add")}
                </Button>
              </InputGroup>
            )}
          />
        )}
        {excludedPackages.length > 0 && (
          <div className={spacing.plLg}>
            {excludedPackages.map(
              (pkg, index) =>
                pkg && (
                  <div key={index}>
                    <InputGroup key={index}>
                      <InputGroupText className="package">{pkg}</InputGroupText>
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
