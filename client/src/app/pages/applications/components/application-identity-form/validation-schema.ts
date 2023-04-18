import * as yup from "yup";
import { SOURCE_CREDENTIALS, MAVEN_SETTINGS } from "./field-names";

export default function validationSchema(
  mandatoryFields = {
    [SOURCE_CREDENTIALS]: false,
    [MAVEN_SETTINGS]: false,
  }
) {
  return yup.object({
    [SOURCE_CREDENTIALS]: yup.lazy(() =>
      mandatoryFields[SOURCE_CREDENTIALS]
        ? yup.string().required()
        : yup.string()
    ),
    [MAVEN_SETTINGS]: yup.lazy(() =>
      mandatoryFields[MAVEN_SETTINGS] ? yup.string().required() : yup.string()
    ),
  });
}
