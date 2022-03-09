import * as yup from "yup";
import {
  APPLICATION_NAME,
  SOURCE_CREDENTIALS,
  MAVEN_SETTINGS,
} from "./field-names";

const REQUIRED_MESSAGE = "This field is required";

export default function validationSchema(
  mandatoryFields = {
    [APPLICATION_NAME]: false,
    [SOURCE_CREDENTIALS]: false,
    [MAVEN_SETTINGS]: false,
  }
) {
  return yup.object({
    [APPLICATION_NAME]: yup.lazy(() =>
      mandatoryFields[APPLICATION_NAME]
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    [SOURCE_CREDENTIALS]: yup.lazy(() =>
      mandatoryFields[SOURCE_CREDENTIALS]
        ? yup.object({ id: yup.string(), name: yup.string() }).required()
        : yup.object({ id: yup.string(), name: yup.string() })
    ),
    [MAVEN_SETTINGS]: yup.lazy(() =>
      mandatoryFields[MAVEN_SETTINGS]
        ? yup.object({ id: yup.string(), name: yup.string() }).required()
        : yup.object({ id: yup.string(), name: yup.string() })
    ),
  });
}
