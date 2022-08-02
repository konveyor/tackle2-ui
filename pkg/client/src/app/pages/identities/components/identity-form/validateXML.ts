const { xmllint } = require("xmllint");

export const validateXML = (value, currentSchema) => {
  const validationResult = xmllint.validateXML({
    xml: value,
    schema: currentSchema,
  });
  return validationResult;
};
