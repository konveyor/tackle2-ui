import * as yup from "yup";
import {
  APPLICATION_NAME,
  SOURCE_CREDENTIALS,
  MAVEN_SETTINGS,
} from "./field-names";

const REQUIRED_MESSAGE = "This field is required";

export default function validationSchema(
  mandatoryFields = {
    [SOURCE_CREDENTIALS]: false,
    [MAVEN_SETTINGS]: false,
  }
) {
  return yup.object({
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
