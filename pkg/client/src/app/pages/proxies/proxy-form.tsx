import React, { useEffect, useMemo, useState } from "react";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Switch,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import { OptionWithValue, SimpleSelect } from "@app/shared/components";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";
import validationSchema from "./proxies-validation-schema";
import {
  EXCLUDED,
  HTTPS_HOST,
  HTTPS_IDENTITY,
  HTTPS_PORT,
  HTTP_HOST,
  HTTP_IDENTITY,
  HTTP_PORT,
} from "./field-names";
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
import { triggerAsyncId } from "async_hooks";

export interface ProxyFormValues {
  httpHost: string;
  httpsHost: string;
  httpIdentity: string | null;
  httpsIdentity: string | null;
  httpPort: any;
  httpsPort: any;
  excluded: string;
}

export interface ProxyFormProps {
  httpProxy?: Proxy;
  httpsProxy?: Proxy;
  isSecure?: boolean;
}

export const ProxyForm: React.FC<ProxyFormProps> = ({
  httpProxy,
  httpsProxy,
}) => {
  const [isHttpIdentityRequired, setIsHttpIdentityRequired] = useState(false);
  const [isHttpsIdentityRequired, setIsHttpsIdentityRequired] = useState(false);
  const [isHttpProxy, setIsHttpProxy] = React.useState(false);
  const [isHttpsProxy, setIsHttpsProxy] = React.useState(false);
  const {
    identities,
    isFetching: isFetchingIdentities,
    fetchError: fetchErrorIdentities,
  } = useFetchIdentities();

  const identityOptions = identities.map((identity) => {
    return {
      value: identity?.name || "",
      toString: () => identity?.name || "",
    };
  });
  useEffect(() => {
    if (httpProxy?.identity?.name) {
      setIsHttpIdentityRequired(true);
    }
    if (httpsProxy?.identity?.name) {
      setIsHttpsIdentityRequired(true);
    }
  }, [httpProxy, httpsProxy]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValidating, isValid, isDirty },
    getValues,
    setValue,
    setError,
    control,
    resetField,
    watch,
    reset,
    trigger,
  } = useForm<ProxyFormValues>({
    defaultValues: useMemo(() => {
      return {
        [HTTP_HOST]: httpProxy?.host,
        [HTTP_PORT]: httpProxy?.port || 8080,
        [HTTP_IDENTITY]: httpProxy?.identity?.name || null,
        [HTTPS_HOST]: httpsProxy?.host || "",
        [HTTPS_PORT]: httpsProxy?.port || 8080,
        [HTTPS_IDENTITY]: httpsProxy?.identity?.name || null,
        [EXCLUDED]: httpProxy?.excluded.join(",") || "",
      };
    }, [httpProxy, httpsProxy]),
    resolver: yupResolver(
      validationSchema({
        [HTTP_HOST]: isHttpProxy,
        [HTTP_PORT]: isHttpProxy,
        [HTTP_IDENTITY]: isHttpIdentityRequired,
        [HTTPS_HOST]: isHttpsProxy,
        [HTTPS_PORT]: isHttpsProxy,
        [HTTPS_IDENTITY]: isHttpsIdentityRequired,
      })
    ),
    mode: "onChange",
  });
  useEffect(() => {
    reset({
      [HTTP_HOST]: httpProxy?.host,
      [HTTP_PORT]: httpProxy?.port || 8080,
      [HTTP_IDENTITY]: httpProxy?.identity?.name || null,
      [HTTPS_HOST]: httpsProxy?.host || "",
      [HTTPS_PORT]: httpsProxy?.port || 8080,
      [HTTPS_IDENTITY]: httpsProxy?.identity?.name || null,
      [EXCLUDED]: httpProxy?.excluded.join(",") || "",
    });
  }, [httpProxy, httpsProxy]);

  const values = getValues();

  useEffect(() => {
    if (httpProxy) {
      setIsHttpProxy(httpProxy.enabled);
    }
    if (httpsProxy) {
      setIsHttpsProxy(httpsProxy.enabled);
    }
  }, [httpProxy, httpsProxy]);

  const onProxySubmitComplete = () => {
    reset(values);
  };

  const onChangeProxyStatusComplete = (proxyType: string) => {
    if (proxyType === "http") {
      setIsHttpProxy(!isHttpProxy);
    }

    if (proxyType === "https") {
      setIsHttpsProxy(!isHttpsProxy);
    }
  };

  const {
    mutate: submitProxy,
    putResult,
    isLoading,
    error,
  } = useUpdateProxyMutation(onProxySubmitComplete);

  const { mutate: changeProxyStatus } = useUpdateProxyMutation(
    onChangeProxyStatusComplete
  );

  const onChangeIsHttpProxy = () => {
    if (httpProxy) {
      const httpPayload = {
        host: values.httpHost,
        kind: "http",
        port: values.httpPort || 8080,
        id: httpProxy?.id,
        enabled: !isHttpProxy,
        excluded: httpProxy.excluded,
      };

      if (httpProxy) {
        changeProxyStatus({
          ...httpPayload,
        });
        setIsHttpProxy(!isHttpProxy);
      }
    }
    trigger();
  };

  const onChangeIsHttpsProxy = () => {
    if (httpsProxy) {
      const httpsPayload = {
        host: values.httpsHost,
        kind: "https",
        port: values.httpsPort || 8080,
        id: httpsProxy.id,
        enabled: !isHttpsProxy,
        excluded: httpsProxy.excluded,
      };

      if (httpsProxy) {
        changeProxyStatus({
          ...httpsPayload,
        });
        setIsHttpsProxy(!isHttpsProxy);
      }
    }
    trigger();
  };
  const onChangeIsHttpsIdentityRequired = () => {
    if (isHttpsIdentityRequired) {
      let result = null;
      setValue(HTTPS_IDENTITY, result, {
        shouldDirty: true,
      });
    }
    setIsHttpsIdentityRequired(!isHttpsIdentityRequired);
  };

  const onChangeIsHttpIdentityRequired = () => {
    if (isHttpIdentityRequired) {
      let result = null;
      setValue(HTTP_IDENTITY, result, {
        shouldDirty: true,
      });
    }
    setIsHttpIdentityRequired(!isHttpIdentityRequired);
  };

  const httpValuesHaveUpdate = (values: FieldValues, httpProxy?: Proxy) => {
    if (httpProxy?.host === "" && isHttpProxy) {
      return true;
    } else {
      return (
        values.excluded !== httpProxy?.excluded.join() ||
        values.httpHost !== httpProxy?.host ||
        (values.httpIdentity !== null &&
          values.httpIdentity !== httpProxy?.identity?.name) ||
        (values.httpIdentity === null &&
          values.httpIdentity !== httpProxy?.identity) ||
        parseInt(values.httpPort) !== httpProxy?.port
      );
    }
  };

  const httpsValuesHaveUpdate = (values: FieldValues, httpsProxy?: Proxy) => {
    if (httpsProxy?.host === "" && isHttpsProxy) {
      return true;
    }

    return (
      values.excluded !== httpsProxy?.excluded.join() ||
      values.httpsHost !== httpsProxy?.host ||
      (values.httpsIdentity !== null &&
        values.httpsIdentity !== httpsProxy?.identity?.name) ||
      (values.httpsIdentity === null &&
        values.httpsIdentity !== httpsProxy?.identity) ||
      parseInt(values.httpsPort) !== httpsProxy?.port
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
      port: parseInt(formValues?.httpsPort as string),
      enabled: httpsProxy?.enabled || true,
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
      port: parseInt(formValues?.httpPort as string),
      enabled: httpProxy?.enabled || true,
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
        <Alert variant="danger" isInline title={getAxiosErrorMessage(error)} />
      )}
      <Switch
        id="httpProxy"
        className="proxy"
        label="HTTP proxy"
        aria-label="HTTP Proxy"
        isChecked={isHttpProxy}
        onChange={onChangeIsHttpProxy}
      />

      {isHttpProxy && (
        <div className={spacing.mlLg}>
          <FormGroup
            label="HTTP proxy host"
            fieldId={HTTP_HOST}
            isRequired={true}
            className={spacing.mMd}
            validated={getValidatedFromError(errors.httpHost)}
            helperTextInvalid={errors.httpHost?.message}
          >
            <Controller
              control={control}
              name={HTTP_HOST}
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { isTouched, error },
                formState,
              }) => (
                <TextInput
                  type="text"
                  name={HTTP_HOST}
                  aria-label="httphost"
                  aria-describedby="httphost"
                  isRequired={true}
                  onChange={onChange}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              )}
            />
          </FormGroup>
          <Controller
            control={control}
            name={HTTP_PORT}
            render={({
              field: { onChange, onBlur, value, name, ref },
              fieldState: { isTouched, error },
              formState,
            }) => (
              <FormGroup
                label="HTTP proxy port"
                type="number"
                fieldId="port"
                className={spacing.mMd}
                isRequired={true}
                validated={getValidatedFromError(error)}
                helperTextInvalid={error?.message}
              >
                <TextInput
                  type="number"
                  name={HTTP_PORT}
                  aria-label="httpport"
                  aria-describedby="httpport"
                  isRequired={true}
                  onChange={(value, e) => {
                    onChange((value && parseInt(value, 10)) || "");
                  }}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              </FormGroup>
            )}
          />
          <Switch
            id="http-identity-required"
            className={spacing.mMd}
            label="HTTP proxy credentials"
            aria-label="http identity required"
            isChecked={isHttpIdentityRequired}
            onChange={onChangeIsHttpIdentityRequired}
          />
          {isHttpIdentityRequired && (
            <Controller
              control={control}
              name={HTTP_IDENTITY}
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { isTouched, error },
                formState,
              }) => (
                <FormGroup
                  label="HTTP proxy credentials"
                  className={spacing.mMd}
                  fieldId={HTTP_IDENTITY}
                  isRequired={isHttpIdentityRequired}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                  helperTextInvalid={errors.httpIdentity?.message}
                >
                  <SimpleSelect
                    aria-label={HTTP_IDENTITY}
                    value={value ? value : undefined}
                    options={identityOptions}
                    onChange={(selection) => {
                      const selectionValue = selection as OptionWithValue<any>;
                      onChange(selectionValue.value);
                    }}
                  />
                </FormGroup>
              )}
            />
          )}
        </div>
      )}
      <Switch
        id="httpsProxy"
        label="HTTPS proxy"
        aria-label="HTTPS Proxy"
        isChecked={isHttpsProxy}
        onChange={onChangeIsHttpsProxy}
      />

      {isHttpsProxy && (
        <>
          <FormGroup
            label="HTTPS proxy host"
            className={spacing.mMd}
            fieldId="httpsHost"
            isRequired={true}
            validated={getValidatedFromError(errors.httpsHost)}
            helperTextInvalid={errors.httpsHost?.message}
          >
            <Controller
              control={control}
              name={HTTPS_HOST}
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { isTouched, error },
                formState,
              }) => (
                <TextInput
                  type="text"
                  name={HTTPS_HOST}
                  aria-label="httpshost"
                  aria-describedby="httpshost"
                  isRequired={true}
                  onChange={onChange}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              )}
            />
          </FormGroup>
          <FormGroup
            label="HTTPS proxy port"
            className={spacing.mMd}
            type="number"
            fieldId="port"
            isRequired={true}
            validated={getValidatedFromError(errors.httpsPort)}
            helperTextInvalid={errors.httpsPort?.message}
          >
            <Controller
              control={control}
              name={HTTPS_PORT}
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { isTouched, error },
                formState,
              }) => (
                <TextInput
                  type="number"
                  name={HTTPS_PORT}
                  aria-label="httpsport"
                  aria-describedby="httpsport"
                  isRequired={true}
                  onChange={(value, e) => {
                    onChange((value && parseInt(value, 10)) || "");
                  }}
                  value={value}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                />
              )}
            />
          </FormGroup>
          <Switch
            id="https-identity-required"
            className={spacing.mMd}
            label="HTTPS proxy credentials"
            aria-label="httpS identity required"
            isChecked={isHttpsIdentityRequired}
            onChange={onChangeIsHttpsIdentityRequired}
          />
          {isHttpsIdentityRequired && (
            <Controller
              control={control}
              name={HTTPS_IDENTITY}
              render={({
                field: { onChange, onBlur, value, name, ref },
                fieldState: { isTouched, error },
                formState,
              }) => (
                <FormGroup
                  label="HTTPS proxy credentials"
                  className={spacing.mMd}
                  fieldId={HTTPS_IDENTITY}
                  isRequired={isHttpsIdentityRequired}
                  validated={getValidatedFromErrorTouched(error, isTouched)}
                  helperTextInvalid={errors.httpsIdentity?.message}
                >
                  <SimpleSelect
                    aria-label={HTTPS_IDENTITY}
                    value={value ? value : undefined}
                    options={identityOptions}
                    onChange={(selection) => {
                      const selectionValue = selection as OptionWithValue<any>;
                      onChange(selectionValue.value);
                    }}
                  />
                </FormGroup>
              )}
            />
          )}
        </>
      )}
      {(isHttpProxy || isHttpsProxy) && (
        <FormGroup
          label="Excluded"
          fieldId="excluded"
          isRequired={false}
          validated={getValidatedFromError(errors.excluded)}
          helperTextInvalid={errors.excluded?.message}
        >
          <Controller
            control={control}
            name={EXCLUDED}
            render={({
              field: { onChange, onBlur, value, name, ref },
              fieldState: { isTouched, error },
              formState,
            }) => (
              <TextArea
                type="text"
                name="excluded"
                aria-label="excluded"
                aria-describedby="excluded"
                isRequired={false}
                onChange={onChange}
                value={value}
                validated={getValidatedFromErrorTouched(error, isTouched)}
              />
            )}
          />
        </FormGroup>
      )}
      <ActionGroup>
        <Button
          type="submit"
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
