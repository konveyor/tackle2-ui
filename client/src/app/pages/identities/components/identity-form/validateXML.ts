const { xmllint } = require("xmllint");

export const validateXML = (value: string, currentSchema: string) => {
  const validationResult = xmllint.validateXML({
    xml: value,
    schema: currentSchema,
  });
  return validationResult;
};
