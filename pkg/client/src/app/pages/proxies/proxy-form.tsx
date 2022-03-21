import React, { useEffect, useMemo, useState } from "react";
import { useFormik, FormikProvider } from "formik";
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
import { SingleSelectFetchOptionValueFormikField } from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
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
  IS_HTTPS_CHECKED,
  IS_HTTP_CHECKED,
} from "./field-names";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";
import {
  IdentityDropdown,
  toIdentityDropdown,
  toIdentityDropdownOptionWithValue,
} from "@app/utils/model-utils";
import { Proxy } from "@app/api/models";
import { useUpdateProxyMutation } from "@app/queries/proxies";

export interface ProxyFormValues {
  httpHost: string;
  httpsHost: string;
  httpIdentity: IdentityDropdown;
  httpsIdentity: IdentityDropdown;
  httpPort: number;
  httpsPort: number;
  isHttpChecked: boolean;
  isHttpsChecked: boolean;
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

  useEffect(() => {
    if (httpProxy) {
      setIsHttpProxy(httpProxy.enabled);
    }
    if (httpsProxy) {
      setIsHttpsProxy(httpsProxy.enabled);
    }
  }, [httpProxy, httpsProxy]);

  const onProxySubmitComplete = () => {
    formik.setSubmitting(false);
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
    if (formik.values.isHttpChecked && httpProxy) {
      const httpPayload = {
        host: formik.values.httpHost,
        kind: "http",
        port: formik.values.httpPort,
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
  };

  const onChangeIsHttpsProxy = () => {
    if (formik.values.isHttpsChecked && httpsProxy) {
      const httpsPayload = {
        host: formik.values.httpsHost,
        kind: "https",
        port: formik.values.httpsPort,
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
  };

  const {
    identities,
    isFetching: isFetchingIdentities,
    fetchError: fetchErrorIdentities,
    fetchIdentities,
  } = useFetchIdentities();

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const httpValuesHaveUpdate = (values: ProxyFormValues, httpProxy?: Proxy) => {
    if (httpProxy?.host === "" && isHttpProxy) {
      return true;
    } else {
      return (
        values.excluded !== httpProxy?.excluded.join() ||
        values.httpHost !== httpProxy?.host ||
        (values.httpIdentity.id &&
          values.httpIdentity !== httpProxy?.identity) ||
        values.httpPort !== httpProxy?.port
      );
    }
  };
  const httpsValuesHaveUpdate = (
    values: ProxyFormValues,
    httpsProxy?: Proxy
  ) => {
    if (httpsProxy?.host === "" && isHttpsProxy) {
      return true;
    }

    return (
      values.excluded !== httpsProxy?.excluded.join() ||
      values.httpsHost !== httpsProxy?.host ||
      (values.httpsIdentity.id &&
        values.httpsIdentity !== httpsProxy?.identity) ||
      values.httpsPort !== httpsProxy?.port
    );
  };

  const onSubmit = (formValues: ProxyFormValues) => {
    const httpsPayload: Proxy = {
      kind: "https",
      excluded: formValues.excluded.split(","),
      host: formValues.httpsHost,
      port: formValues.httpsPort,
      enabled: httpsProxy?.enabled || true,
      id: httpsProxy?.id,
      ...(formValues.httpsIdentity?.id &&
        formValues.httpsIdentity?.name && {
          identity: {
            id: formValues.httpsIdentity?.id,
            name: formValues.httpsIdentity?.name,
          },
        }),
    };

    const httpPayload: Proxy = {
      kind: "http",
      excluded: formValues.excluded.split(","),
      host: formValues.httpHost,
      port: formValues.httpPort,
      enabled: httpProxy?.enabled || true,
      id: httpProxy?.id,
      ...(formValues.httpIdentity?.id &&
        formValues.httpIdentity?.name && {
          identity: {
            id: formValues.httpIdentity.id,
            name: formValues.httpIdentity.name,
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

  const httpIdentityInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (httpProxy && identities) {
      const identityId = Number(httpProxy.identity?.id);
      const identity = identities.find((i) => i.id === identityId);

      if (identity) {
        result = toIdentityDropdown({
          id: identityId,
          name: identity.name,
        });
      }
    }
    setIsHttpIdentityRequired(!!result.id);
    return result;
  }, [identities, httpProxy]);

  const httpsIdentityInitialValue = useMemo(() => {
    let result: IdentityDropdown = { id: 0, name: "" };
    if (httpsProxy && identities) {
      const identityId = Number(httpsProxy.identity?.id);
      const identity = identities.find((i) => i.id === identityId);

      if (identity) {
        result = toIdentityDropdown({
          id: identityId,
          name: identity.name,
        });
      }
    }
    setIsHttpsIdentityRequired(!!result.id);
    return result;
  }, [identities, httpProxy]);

  const initialValues: ProxyFormValues = {
    [HTTP_HOST]: httpProxy?.host || "",
    [HTTP_PORT]: httpProxy?.port || 8080,
    [HTTP_IDENTITY]: httpIdentityInitialValue,
    [IS_HTTP_CHECKED]: !!httpProxy || false,
    [HTTPS_HOST]: httpsProxy?.host || "",
    [HTTPS_PORT]: httpsProxy?.port || 8080,
    [HTTPS_IDENTITY]: httpsIdentityInitialValue,
    [IS_HTTPS_CHECKED]: !!httpsProxy || false,
    [EXCLUDED]: httpProxy?.excluded.join(",") || "",
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema({
      [HTTP_HOST]: isHttpProxy,
      [HTTP_PORT]: isHttpProxy,
      [HTTP_IDENTITY]: isHttpIdentityRequired,
      [HTTPS_HOST]: isHttpsProxy,
      [HTTPS_PORT]: isHttpsProxy,
      [HTTPS_IDENTITY]: isHttpIdentityRequired,
    }),
    onSubmit: onSubmit,
  });

  const onChangeIsHttpsIdentityRequired = () => {
    if (isHttpsIdentityRequired) {
      let result: IdentityDropdown = { id: 0, name: "" };
      formik.setFieldValue(HTTPS_IDENTITY, result);
    }
    setIsHttpsIdentityRequired(!isHttpsIdentityRequired);
  };

  const onChangeIsHttpIdentityRequired = () => {
    if (isHttpIdentityRequired) {
      let result: IdentityDropdown = { id: 0, name: "" };
      formik.setFieldValue(HTTP_IDENTITY, result);
    }
    setIsHttpIdentityRequired(!isHttpIdentityRequired);
  };

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const [hasUpdate, setHasUpdate] = useState(false);
  useEffect(() => {
    if (
      httpValuesHaveUpdate(formik.values, httpProxy) ||
      httpsValuesHaveUpdate(formik.values, httpsProxy)
    ) {
      setHasUpdate(true);
    } else {
      setHasUpdate(false);
    }
  }, [formik.values, httpProxy, httpsProxy]);

  return (
    <FormikProvider value={formik}>
      <Form className={spacing.mMd} onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
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
              fieldId="httpHost"
              isRequired={true}
              className={spacing.mMd}
              validated={getValidatedFromError(formik.errors.httpHost)}
              helperTextInvalid={formik.errors.httpHost}
            >
              <TextInput
                type="text"
                name={HTTP_HOST}
                aria-label="httphost"
                aria-describedby="httphost"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpHost}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpHost,
                  formik.touched.httpHost
                )}
              />
            </FormGroup>
            <FormGroup
              label="HTTP proxy port"
              fieldId="port"
              className={spacing.mMd}
              isRequired={true}
              validated={getValidatedFromError(formik.errors.httpPort)}
              helperTextInvalid={formik.errors.httpPort}
            >
              <TextInput
                type="number"
                name={HTTP_PORT}
                aria-label="httpport"
                aria-describedby="httpport"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpPort}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpPort,
                  formik.touched.httpPort
                )}
              />
            </FormGroup>
            <Switch
              id="http-identity-required"
              className={spacing.mMd}
              label="HTTP proxy credentials"
              aria-label="http identity required"
              isChecked={isHttpIdentityRequired}
              onChange={onChangeIsHttpIdentityRequired}
            />
            {isHttpIdentityRequired && (
              <FormGroup
                label="HTTP proxy credentials"
                className={spacing.mMd}
                fieldId={HTTP_IDENTITY}
                isRequired={isHttpIdentityRequired}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpIdentity,
                  formik.touched?.httpIdentity
                )}
                helperTextInvalid={formik.errors.httpIdentity}
              >
                <SingleSelectFetchOptionValueFormikField
                  fieldConfig={{ name: HTTP_IDENTITY }}
                  selectConfig={{
                    variant: "typeahead",
                    "aria-label": "identity",
                    "aria-describedby": "identity",
                    typeAheadAriaLabel: "identity",
                    toggleAriaLabel: "identity",
                    clearSelectionsAriaLabel: "identity",
                    removeSelectionAriaLabel: "identity",
                    placeholderText: "Select identity type",
                    menuAppendTo: () => document.body,
                    maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                    fetchError: fetchErrorIdentities,
                    isFetching: isFetchingIdentities,
                  }}
                  options={(
                    identities?.filter(
                      (identity) => identity.kind === "proxy"
                    ) || []
                  ).map(toIdentityDropdown)}
                  toOptionWithValue={toIdentityDropdownOptionWithValue}
                />
              </FormGroup>
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
              validated={getValidatedFromError(formik.errors.httpsHost)}
              helperTextInvalid={formik.errors.httpsHost}
            >
              <TextInput
                type="text"
                name={HTTPS_HOST}
                aria-label="httpshost"
                aria-describedby="httpshost"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpsHost}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsHost,
                  formik.touched.httpsHost
                )}
              />
            </FormGroup>
            <FormGroup
              label="HTTPS proxy port"
              className={spacing.mMd}
              fieldId="port"
              isRequired={true}
              validated={getValidatedFromError(formik.errors.httpsPort)}
              helperTextInvalid={formik.errors.httpsPort}
            >
              <TextInput
                type="number"
                name={HTTPS_PORT}
                aria-label="httpsport"
                aria-describedby="httpsport"
                isRequired={true}
                onChange={onChangeField}
                onBlur={formik.handleBlur}
                value={formik.values.httpsPort}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsPort,
                  formik.touched.httpsPort
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
              <FormGroup
                label="HTTPS proxy credentials"
                className={spacing.mMd}
                fieldId={HTTPS_IDENTITY}
                isRequired={isHttpsIdentityRequired}
                validated={getValidatedFromErrorTouched(
                  formik.errors.httpsIdentity,
                  formik.touched.httpsIdentity
                )}
                helperTextInvalid={formik.errors.httpsIdentity}
              >
                <SingleSelectFetchOptionValueFormikField
                  fieldConfig={{ name: HTTPS_IDENTITY }}
                  selectConfig={{
                    variant: "typeahead",
                    "aria-label": "identity",
                    "aria-describedby": "identity",
                    typeAheadAriaLabel: "identity",
                    toggleAriaLabel: "identity",
                    clearSelectionsAriaLabel: "identity",
                    removeSelectionAriaLabel: "identity",
                    placeholderText: "Select identity type",
                    menuAppendTo: () => document.body,
                    maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                    fetchError: fetchErrorIdentities,
                    isFetching: isFetchingIdentities,
                  }}
                  options={(
                    identities?.filter(
                      (identity) => identity.kind === "proxy"
                    ) || []
                  ).map(toIdentityDropdown)}
                  toOptionWithValue={toIdentityDropdownOptionWithValue}
                />
              </FormGroup>
            )}
          </>
        )}
        {(isHttpProxy || isHttpsProxy) && (
          <FormGroup
            label="Excluded"
            fieldId="excluded"
            isRequired={false}
            validated={getValidatedFromError(formik.errors.excluded)}
            helperTextInvalid={formik.errors.excluded}
          >
            <TextArea
              type="text"
              name="excluded"
              aria-label="excluded"
              aria-describedby="excluded"
              isRequired={false}
              onChange={onChangeField}
              onBlur={formik.handleBlur}
              value={formik.values.excluded}
              validated={getValidatedFromErrorTouched(
                formik.errors.excluded,
                formik.touched.excluded
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
              !formik.isValid ||
              formik.isSubmitting ||
              formik.isValidating ||
              !hasUpdate
            }
          >
            {httpValuesHaveUpdate(formik.values, httpProxy) ||
            httpsValuesHaveUpdate(formik.values, httpsProxy)
              ? "Save"
              : "Update"}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
