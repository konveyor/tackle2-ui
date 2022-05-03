import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return yup.object().shape({
    //http
    [HTTP_HOST]: yup.lazy(() =>
      mandatoryFields[HTTP_HOST]
        ? yup
            .string()
            .required(REQUIRED_MESSAGE)
            .min(3, t("validation.minLength", { length: 3 }))
            .max(120, t("validation.maxLength", { length: 120 }))
        : yup.string()
    ),
    [HTTP_PORT]: yup.lazy(() =>
      mandatoryFields[HTTP_PORT]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    [HTTP_IDENTITY]: yup.lazy(() =>
      mandatoryFields[HTTP_IDENTITY]
        ? yup.string().required(REQUIRED_MESSAGE).nullable()
        : yup.string().nullable()
    ),
    //https
    [HTTPS_HOST]: yup.lazy(() =>
      mandatoryFields[HTTPS_HOST]
        ? yup
            .string()
            .required(REQUIRED_MESSAGE)
            .min(3, t("validation.minLength", { length: 3 }))
            .max(120, t("validation.maxLength", { length: 120 }))
        : yup.string()
    ),
    [HTTPS_PORT]: yup.lazy(() =>
      mandatoryFields[HTTPS_PORT]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    [HTTPS_IDENTITY]: yup.lazy(() =>
      mandatoryFields[HTTPS_IDENTITY]
        ? yup.string().required(REQUIRED_MESSAGE).nullable()
        : yup.string().nullable()
    ),
  });
}
