import React, { useMemo } from "react";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  Switch,
} from "@patternfly/react-core";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import { getAxiosErrorMessage, getValidatedFromErrors } from "@app/utils/utils";
import { useProxyFormValidationSchema } from "./proxies-validation-schema";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { Proxy } from "@app/api/models";
import { useUpdateProxyMutation } from "@app/queries/proxies";
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useFetchIdentities } from "@app/queries/identities";
import { AxiosError } from "axios";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/shared/components/hook-form-pf-fields";

export interface ProxyFormValues {
  isHttpProxyEnabled: boolean;
  httpHost: string;
  httpPort: number | string;
  isHttpIdentityRequired: boolean;
  httpIdentity: string | null;
  isHttpsProxyEnabled: boolean;
  httpsHost: string;
  httpsPort: number | string;
  isHttpsIdentityRequired: boolean;
  httpsIdentity: string | null;
  excluded: string;
}

export interface ProxyFormProps {
  httpProxy?: Proxy;
  httpsProxy?: Proxy;
}

export const ProxyForm: React.FC<ProxyFormProps> = ({
  httpProxy,
  httpsProxy,
}) => {
  const { identities } = useFetchIdentities();

  const identityOptions: OptionWithValue<string>[] = identities
    .filter((i) => i.kind === "proxy")
    .map((identity) => {
      return {
        value: identity?.name || "",
        toString: () => identity?.name || "",
      };
    });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    control,
    reset,
  } = useForm<ProxyFormValues>({
    defaultValues: useMemo<ProxyFormValues>(
      () => ({
        // http
        isHttpProxyEnabled: httpProxy?.enabled === true,
        httpHost: httpProxy?.host || "",
        httpPort: httpProxy?.port || 8080,
        isHttpIdentityRequired: !!httpProxy?.identity?.name,
        httpIdentity: httpProxy?.identity?.name || null,
        // https
        isHttpsProxyEnabled: httpsProxy?.enabled === true,
        httpsHost: httpsProxy?.host || "",
        httpsPort: httpsProxy?.port || 8080,
        isHttpsIdentityRequired: !!httpsProxy?.identity?.name,
        httpsIdentity: httpsProxy?.identity?.name || null,
        excluded: httpProxy?.excluded.join(",") || "",
      }),
      [httpProxy, httpsProxy]
    ),
    resolver: yupResolver(useProxyFormValidationSchema()),
    mode: "onChange",
  });

  const values = getValues();

  const onProxySubmitComplete = () => {
    reset(values);
  };

  const {
    mutate: submitProxy,
    isLoading,
    error,
  } = useUpdateProxyMutation(onProxySubmitComplete);

  const httpValuesHaveUpdate = (values: ProxyFormValues, httpProxy?: Proxy) => {
    if (httpProxy?.host === "" && values.isHttpProxyEnabled) {
      return true;
    }
    return (
      values.isHttpProxyEnabled !== httpProxy?.enabled ||
      values.excluded !== httpProxy?.excluded.join() ||
      values.httpHost !== httpProxy?.host ||
      (values.httpIdentity !== null &&
        values.httpIdentity !== httpProxy?.identity?.name) ||
      (values.httpIdentity === null &&
        values.httpIdentity !== httpProxy?.identity) ||
      parseInt(values.httpPort as string, 10) !== httpProxy?.port
    );
  };

  const httpsValuesHaveUpdate = (values: FieldValues, httpsProxy?: Proxy) => {
    if (httpsProxy?.host === "" && values.isHttpsProxyEnabled) {
      return true;
    }
    return (
      values.isHttpsProxyEnabled !== httpsProxy?.enabled ||
      values.excluded !== httpsProxy?.excluded.join() ||
      values.httpsHost !== httpsProxy?.host ||
      (values.httpsIdentity !== null &&
        values.httpsIdentity !== httpsProxy?.identity?.name) ||
      (values.httpsIdentity === null &&
        values.httpsIdentity !== httpsProxy?.identity) ||
      parseInt(values.httpsPort, 10) !== httpsProxy?.port
    );
  };

  const onSubmit: SubmitHandler<ProxyFormValues> = (formValues) => {
    const selectedHttpIdentity = identities.find(
      (i) => i.name === formValues.httpIdentity
    );
    const selectedHttpsIdentity = identities.find(
      (i) => i.name === formValues.httpsIdentity
    );

    const httpsPayload: Proxy = {
      kind: "https",
      excluded: formValues.excluded.split(","),
      host: formValues.httpsHost,
      port: parseInt(formValues?.httpsPort as string, 10),
      enabled: formValues.isHttpsProxyEnabled,
      id: httpsProxy?.id,
      ...(formValues.httpsIdentity &&
        selectedHttpsIdentity && {
          identity: {
            id: selectedHttpsIdentity?.id || 0,
            name: selectedHttpsIdentity?.name || "",
          },
        }),
    };

    const httpPayload: Proxy = {
      kind: "http",
      excluded: formValues.excluded.split(","),
      host: formValues.httpHost,
      port: parseInt(formValues?.httpPort as string, 10),
      enabled: formValues.isHttpProxyEnabled,
      id: httpProxy?.id,
      ...(formValues.httpIdentity &&
        selectedHttpIdentity && {
          identity: {
            id: selectedHttpIdentity?.id || 0,
            name: selectedHttpIdentity?.name || "",
          },
        }),
    };

    if (httpProxy && httpValuesHaveUpdate(formValues, httpProxy)) {
      submitProxy(httpPayload);
    }

    if (httpsProxy && httpsValuesHaveUpdate(formValues, httpsProxy)) {
      submitProxy(httpsPayload);
    }
  };

  return (
    <Form className={spacing.mMd} onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <Alert
          variant="danger"
          isInline
          title={getAxiosErrorMessage(error as AxiosError)}
        />
      )}
      <Controller
        control={control}
        name="isHttpProxyEnabled"
        render={({ field: { onChange, value, name, ref } }) => (
          <Switch
            id="httpProxy"
            name={name}
            className={value ? "http-proxy-checked" : "http-proxy-unchecked"}
            label="HTTP proxy"
            isChecked={value}
            onChange={onChange}
            ref={ref}
          />
        )}
      />
      {values.isHttpProxyEnabled && (
        <div className={spacing.mlLg}>
          <HookFormPFTextInput
            control={control}
            name="httpHost"
            label="HTTP proxy host"
            fieldId="httpHost"
            isRequired
            className={spacing.mMd}
          />
          <HookFormPFTextInput
            control={control}
            name="httpPort"
            label="HTTP proxy port"
            fieldId="port"
            isRequired
            type="number"
            className={spacing.mMd}
          />
          <Controller
            control={control}
            name="isHttpIdentityRequired"
            render={({ field: { onChange, value, name, ref } }) => (
              <Switch
                id="http-identity-required"
                name={name}
                className={`${spacing.mMd} ${
                  value ? "http-identity-checked" : "http-identity-unchecked"
                }`}
                label="HTTP proxy credentials"
                isChecked={value}
                onChange={(checked) => {
                  onChange(checked);
                  if (!checked) {
                    setValue("httpIdentity", null, { shouldDirty: true });
                  }
                }}
                ref={ref}
              />
            )}
          />
          {values.isHttpIdentityRequired && (
            <HookFormPFGroupController
              control={control}
              name="httpIdentity"
              label="HTTP proxy credentials"
              className={spacing.mMd}
              fieldId="httpIdentity"
              isRequired
              renderInput={({
                field: { onChange, value },
                fieldState: { isDirty, error },
              }) => (
                <SimpleSelect
                  id="httpIdentity"
                  toggleId="http-proxy-credentials-select-toggle"
                  aria-label="HTTP proxy credentials"
                  value={value || undefined}
                  options={identityOptions}
                  isDisabled={!identityOptions.length}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<string>;
                    onChange(selectionValue.value);
                  }}
                  validated={getValidatedFromErrors(error, isDirty)}
                />
              )}
            />
          )}
        </div>
      )}
      <Controller
        control={control}
        name="isHttpsProxyEnabled"
        render={({ field: { onChange, value, name, ref } }) => (
          <Switch
            id="httpsProxy"
            name={name}
            className={value ? "https-proxy-checked" : "https-proxy-unchecked"}
            label="HTTPS proxy"
            isChecked={value}
            onChange={onChange}
            ref={ref}
          />
        )}
      />
      {values.isHttpsProxyEnabled && (
        <div className={spacing.mlLg}>
          <HookFormPFTextInput
            control={control}
            label="HTTPS proxy host"
            fieldId="httpsHost"
            name="httpsHost"
            isRequired
            className={spacing.mMd}
          />
          <HookFormPFTextInput
            control={control}
            label="HTTPS proxy port"
            fieldId="port"
            name="httpsPort"
            isRequired
            type="number"
            className={spacing.mMd}
          />
          <Controller
            control={control}
            name="isHttpsIdentityRequired"
            render={({ field: { onChange, value, name, ref } }) => (
              <Switch
                id="https-identity-required"
                name={name}
                className={`${spacing.mMd} ${
                  value ? "https-identity-checked" : "https-identity-unchecked"
                }`}
                label="HTTPS proxy credentials"
                isChecked={value}
                onChange={(checked) => {
                  onChange(checked);
                  if (!checked) {
                    setValue("httpsIdentity", null, { shouldDirty: true });
                  }
                }}
                ref={ref}
              />
            )}
          />
          {values.isHttpsIdentityRequired && (
            <HookFormPFGroupController
              control={control}
              name="httpsIdentity"
              label="HTTPS proxy credentials"
              fieldId="httpsIdentity"
              isRequired
              className={spacing.mMd}
              renderInput={({
                field: { onChange, value },
                fieldState: { isDirty, error },
              }) => (
                <SimpleSelect
                  toggleId="https-proxy-credentials-select-toggle"
                  aria-label="HTTPS proxy credentials"
                  value={value ? value : undefined}
                  options={identityOptions}
                  isDisabled={!identityOptions.length}
                  onChange={(selection) => {
                    const selectionValue = selection as OptionWithValue<string>;
                    onChange(selectionValue.value);
                  }}
                  validated={getValidatedFromErrors(error, isDirty)}
                />
              )}
            />
          )}
        </div>
      )}
      {(values.isHttpProxyEnabled || values.isHttpsProxyEnabled) && (
        <HookFormPFTextArea
          control={control}
          name="excluded"
          label="Excluded"
          fieldId="excluded"
          placeholder="*.example.com, *.example2.com"
        />
      )}
      <ActionGroup>
        <Button
          type="submit"
          id="proxy-form-submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={
            !isValid || isSubmitting || isValidating || isLoading || !isDirty
          }
        >
          {httpProxy || httpsProxy ? "Save" : "Update"}
        </Button>
      </ActionGroup>
    </Form>
  );
};
