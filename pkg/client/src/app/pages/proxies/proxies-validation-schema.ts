import * as yup from "yup";
import { HOST, PORT, IDENTITY } from "./field-names";

const REQUIRED_MESSAGE = "This field is required";

export default function validationSchema(
  mandatoryFields = { [HOST]: true, [PORT]: false, [IDENTITY]: false }
) {
  const createIdentitySchema = () => {
    const identitySchema = yup
      .object()
      .shape({ id: yup.string(), name: yup.string() })
      .nullable();

    return mandatoryFields[IDENTITY]
      ? identitySchema.required(REQUIRED_MESSAGE)
      : identitySchema;
  };

  return yup.object().shape({
    [HOST]: yup.string().required(REQUIRED_MESSAGE),
    [PORT]: yup.lazy(() =>
      mandatoryFields.port
        ? yup.string().required(REQUIRED_MESSAGE)
        : yup.string()
    ),
    ...(mandatoryFields[IDENTITY] && { [IDENTITY]: createIdentitySchema() }),
  });
}
