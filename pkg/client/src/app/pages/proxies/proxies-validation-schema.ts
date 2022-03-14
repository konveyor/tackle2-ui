import * as yup from "yup";
import {
  HTTP_HOST,
  HTTP_PORT,
  HTTP_IDENTITY,
  HTTPS_HOST,
  HTTPS_IDENTITY,
  HTTPS_PORT,
} from "./field-names";

const REQUIRED_MESSAGE = "This field is required";

export default function validationSchema(
  mandatoryFields = {
    [HTTP_HOST]: false,
    [HTTP_PORT]: false,
    [HTTP_IDENTITY]: false,
    [HTTPS_HOST]: false,
    [HTTPS_PORT]: false,
    [HTTPS_IDENTITY]: false,
  }
) {
  const createHttpIdentitySchema = () => {
    const identitySchema = yup
      .object()
      .shape({ id: yup.string(), name: yup.string() })
      .nullable();

    return mandatoryFields[HTTP_IDENTITY]
      ? identitySchema.required(REQUIRED_MESSAGE)
      : identitySchema;
  };

  const createHttpsIdentitySchema = () => {
    const identitySchema = yup
      .object()
      .shape({ id: yup.string(), name: yup.string() })
      .nullable();

    return mandatoryFields[HTTPS_IDENTITY]
      ? identitySchema.required(REQUIRED_MESSAGE)
      : identitySchema;
  };

  return yup.object().shape({
    //http
    [HTTP_HOST]: yup.lazy(() =>
      mandatoryFields[HTTP_HOST]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    [HTTP_PORT]: yup.lazy(() =>
      mandatoryFields[HTTP_PORT]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    ...(mandatoryFields[HTTP_IDENTITY] && {
      [HTTP_IDENTITY]: createHttpIdentitySchema(),
    }),
    //https
    [HTTPS_HOST]: yup.lazy(() =>
      mandatoryFields[HTTPS_HOST]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    [HTTPS_PORT]: yup.lazy(() =>
      mandatoryFields[HTTPS_PORT]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    ...(mandatoryFields[HTTPS_IDENTITY] && {
      [HTTPS_IDENTITY]: createHttpsIdentitySchema(),
    }),
  });
}
