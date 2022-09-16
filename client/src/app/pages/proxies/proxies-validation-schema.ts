import { useTranslation } from "react-i18next";
import * as yup from "yup";
import { ProxyFormValues } from "./proxy-form";

const REQUIRED_MESSAGE = "This field is required";

export const useProxyFormValidationSchema =
  (): yup.SchemaOf<ProxyFormValues> => {
    const { t } = useTranslation();
    return yup.object().shape({
      // http
      isHttpProxyEnabled: yup.boolean().defined(),
      httpHost: yup
        .string()
        .defined()
        .when("isHttpProxyEnabled", (isHttpProxyEnabled, schema) =>
          isHttpProxyEnabled
            ? schema
                .required(REQUIRED_MESSAGE)
                .min(3, t("validation.minLength", { length: 3 }))
                .max(120, t("validation.maxLength", { length: 120 }))
            : schema
        ),
      httpPort: yup
        .string()
        .defined()
        .when("isHttpProxyEnabled", (isHttpProxyEnabled, schema) =>
          isHttpProxyEnabled ? schema.required(REQUIRED_MESSAGE) : schema
        ),
      isHttpIdentityRequired: yup.boolean().defined(),
      httpIdentity: yup
        .string()
        .defined()
        .nullable()
        .when("isHttpIdentityRequired", (isHttpIdentityRequired, schema) =>
          isHttpIdentityRequired ? schema.required(REQUIRED_MESSAGE) : schema
        ),
      // https
      isHttpsProxyEnabled: yup.boolean().defined(),
      httpsHost: yup
        .string()
        .defined()
        .when("isHttpsProxyEnabled", (isHttpsProxyEnabled, schema) =>
          isHttpsProxyEnabled
            ? schema
                .required(REQUIRED_MESSAGE)
                .min(3, t("validation.minLength", { length: 3 }))
                .max(120, t("validation.maxLength", { length: 120 }))
            : schema
        ),
      httpsPort: yup
        .string()
        .defined()
        .when("isHttpsProxyEnabled", (isHttpsProxyEnabled, schema) =>
          isHttpsProxyEnabled ? schema.required(REQUIRED_MESSAGE) : schema
        ),
      isHttpsIdentityRequired: yup.boolean().defined(),
      httpsIdentity: yup
        .string()
        .defined()
        .nullable()
        .when("isHttpsIdentityRequired", (isHttpsIdentityRequired, schema) =>
          isHttpsIdentityRequired ? schema.required(REQUIRED_MESSAGE) : schema
        ),
      excluded: yup.string().defined(),
    });
  };
