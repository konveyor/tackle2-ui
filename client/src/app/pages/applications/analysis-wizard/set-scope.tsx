import * as React from "react";
import {
  Button,
  Form,
  FormGroup,
  InputGroup,
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
import { useTranslation } from "react-i18next";

import { getValidatedFromError } from "@app/utils/utils";

import "./wizard.css";

export const SetScope: React.FC = () => {
  const { t } = useTranslation();

  const { getValues, setValue } = useFormContext();
  const {
    register,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const hasExcludedPackages: boolean = getValues("hasExcludedPackages");
  const withKnown: string = getValues("withKnown");
  const includedPackages: string[] = getValues("includedPackages");
  const excludedPackages: string[] = getValues("excludedPackages");

  const [packageToInclude, setPackageToInclude] = React.useState("");
  const [packageToExclude, setPackageToExclude] = React.useState("");

  const onChangePackageToInclude = (value: string) => {
    setPackageToInclude(value);
  };

  const onChangePackageToExclude = (value: string) => {
    setPackageToExclude(value);
  };

  return (
    <Form>
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
        className={spacing.mbXs}
      />
      {withKnown.includes("select") && (
        <>
          <FormGroup
            fieldId="packageToInclude"
            className={`${spacing.mtMd} ${spacing.plLg}`}
            validated={getValidatedFromError(errors.packageToInclude)}
            helperTextInvalid={errors?.packageToInclude?.message as string}
          >
            <InputGroup>
              <TextInput
                aria-label="Packages to include"
                {...register("packageToInclude", {
                  pattern: {
                    value: /^[a-z]+(.[a-z0-9]+)*$/,
                    message:
                      "The package name should be a valid Java package name",
                  },
                })}
                onChange={onChangePackageToInclude}
                validated={getValidatedFromError(errors.packageToInclude)}
                value={packageToInclude}
              />
              <Button
                id="add-package"
                variant="control"
                isDisabled={
                  getValidatedFromError(errors.packageToInclude) === "error"
                }
                onClick={() => {
                  setValue("includedPackages", [
                    ...includedPackages,
                    packageToInclude,
                  ]);
                  setPackageToInclude("");
                }}
              >
                {t("terms.add")}
              </Button>
            </InputGroup>
          </FormGroup>
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
          id="excludedPackages"
          label={t("wizard.label.excludePackages")}
          isChecked={hasExcludedPackages}
          onChange={() => setValue("hasExcludedPackages", !hasExcludedPackages)}
        />
        {hasExcludedPackages && (
          <FormGroup
            fieldId="packageToExclude"
            className={`${spacing.mtMd} ${spacing.plLg}`}
            validated={getValidatedFromError(errors.packageToExclude)}
            helperTextInvalid={errors?.packageToExclude?.message as string}
          >
            <InputGroup>
              <TextInput
                aria-label="Packages to exclude"
                {...register("packageToExclude", {
                  pattern: {
                    value: /^[a-z]+(.[a-z0-9]+)*$/,
                    message:
                      "The package name should be a valid Java package name",
                  },
                })}
                onChange={onChangePackageToExclude}
                validated={getValidatedFromError(errors.packageToExclude)}
                value={packageToExclude}
              />
              <Button
                id="add-to-excluded-packages-list"
                variant="control"
                isDisabled={
                  getValidatedFromError(errors.packageToExclude) === "error"
                }
                onClick={() => {
                  setValue("excludedPackages", [
                    ...excludedPackages,
                    packageToExclude,
                  ]);
                  setPackageToExclude("");
                }}
              >
                {t("terms.add")}
              </Button>
            </InputGroup>
          </FormGroup>
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
