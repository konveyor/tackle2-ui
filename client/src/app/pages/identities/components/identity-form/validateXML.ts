// eslint-disable-next-line @typescript-eslint/no-var-requires
const { xmllint } = require("xmllint");

export interface XMLLintValidationResult {
  errors: null | string[];
}

export const validateXML = (
  value: string,
  currentSchema: string
): XMLLintValidationResult =>
  xmllint.validateXML({
    xml: value,
    schema: currentSchema,
  });
