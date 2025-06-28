import { XMLValidator } from "fast-xml-parser";

// Import schemas
import schema0 from "./schema-1.0.0.xsd";
import schema1 from "./schema-1.1.0.xsd";
import schema2 from "./schema-1.2.0.xsd";

const XSD_BY_NAME = {
  "1.0.0": schema0,
  "1.1.0": schema1,
  "1.2.0": schema2,
} as const;

type XSD_NAMES = keyof typeof XSD_BY_NAME;

/**
 * Validate if the contents is a schema valid maven settings xml file.
 *
 * @param contents Content to be validated
 * @returns {boolean} `true` if valid, `false` if content is empty
 * @throws {Error} Contents fails validation. Details is the message.
 */
export async function validateSettingsXml(contents?: string) {
  if (contents === undefined || contents.length === 0) {
    return false;
  }

  const validationObject = XMLValidator.validate(contents, {
    allowBooleanAttributes: true,
  });

  if (validationObject !== true) {
    throw new Error(validationObject?.err?.msg?.toString());
  }

  // xml is valid, pick a schema to validate against
  let testXsd = XSD_BY_NAME["1.2.0"];

  if (window.DOMParser) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contents, "text/xml");

    const settings = xmlDoc.getElementsByTagName("settings")[0];
    if (!settings) {
      throw new Error("No settings tag found.");
    }

    const xmlns = settings.getAttribute("xmlns") ?? "";
    const matches = /maven.apache.org\/SETTINGS\/(\d+\.\d+.\d+)$/.exec(xmlns);
    if (matches) {
      const version = matches[1];
      if (version in XSD_BY_NAME) {
        testXsd = XSD_BY_NAME[version as XSD_NAMES];
      }
    }
  }

  // Dynamically import here so bundlers can keep the big wasm module in another chunk
  const { validateXML } = await import("xmllint-wasm");

  // validate the xml vs the xsd
  const validationResult = await validateXML({
    xml: contents,
    schema: testXsd,
  });
  if (validationResult.valid) {
    return true;
  } else {
    throw new Error(
      validationResult.errors.map((e) => e.rawMessage).join(", ")
    );
  }
}
