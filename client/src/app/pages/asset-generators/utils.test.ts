import {
  GeneratorParameter,
  defaultValueError,
  isDuplicateParameterName,
  parametersToSchema,
  schemaToParameters,
} from "./utils";

describe("parametersToSchema", () => {
  it("builds an object JSON Schema from parameter rows", () => {
    const rows: GeneratorParameter[] = [
      { name: "replicas", type: "integer", default: 2 },
      { name: "environment", type: "string", default: "dev" },
    ];

    expect(parametersToSchema(rows)).toEqual({
      type: "object",
      properties: {
        replicas: { type: "integer", default: 2 },
        environment: { type: "string", default: "dev" },
      },
    });
  });

  it("returns an empty object schema for no rows", () => {
    expect(parametersToSchema([])).toEqual({
      type: "object",
      properties: {},
    });
  });

  it("omits the default when a row has not been filled in yet (blank value)", () => {
    // A freshly added row has an empty default until the user types one.
    // The form blocks saving such a row, but the converter must still cope
    // with the blank state and simply leave `default` out of the schema.
    const rows = [
      { name: "env", type: "string", default: "" },
    ] as GeneratorParameter[];

    expect(parametersToSchema(rows)).toEqual({
      type: "object",
      properties: { env: { type: "string" } },
    });
  });

  it("coerces a numeric default entered as a string", () => {
    const rows = [
      { name: "replicas", type: "integer", default: "2" },
    ] as unknown as GeneratorParameter[];

    expect(parametersToSchema(rows)).toEqual({
      type: "object",
      properties: { replicas: { type: "integer", default: 2 } },
    });
  });

  it("coerces a boolean default entered as a string", () => {
    const rows = [
      { name: "flag", type: "boolean", default: "true" },
    ] as unknown as GeneratorParameter[];

    expect(parametersToSchema(rows)).toEqual({
      type: "object",
      properties: { flag: { type: "boolean", default: true } },
    });
  });
});

describe("schemaToParameters", () => {
  it("reconstructs parameter rows from an object JSON Schema (round-trip)", () => {
    const rows: GeneratorParameter[] = [
      { name: "replicas", type: "integer", default: 2 },
      { name: "environment", type: "string", default: "dev" },
    ];

    expect(schemaToParameters(parametersToSchema(rows))).toEqual(rows);
  });

  it("returns no rows for an undefined or empty schema", () => {
    expect(schemaToParameters(undefined)).toEqual([]);
  });
});

describe("defaultValueError", () => {
  it("accepts a valid integer and rejects a non-integer", () => {
    expect(defaultValueError("2", "integer")).toBeNull();
    expect(defaultValueError("-3", "integer")).toBeNull();
    expect(defaultValueError("2.5", "integer")).toBe(
      "validation.mustBeInteger"
    );
    expect(defaultValueError("dev", "integer")).toBe(
      "validation.mustBeInteger"
    );
  });

  it("accepts a valid number and rejects a non-number", () => {
    expect(defaultValueError("2", "number")).toBeNull();
    expect(defaultValueError("2.5", "number")).toBeNull();
    expect(defaultValueError("dev", "number")).toBe("validation.mustBeNumber");
  });

  it("accepts only true or false for boolean", () => {
    expect(defaultValueError("true", "boolean")).toBeNull();
    expect(defaultValueError("false", "boolean")).toBeNull();
    expect(defaultValueError("dev", "boolean")).toBe(
      "validation.mustBeBoolean"
    );
  });

  it("accepts any value for a string parameter", () => {
    expect(defaultValueError("anything", "string")).toBeNull();
  });

  it("rejects a blank value as required", () => {
    expect(defaultValueError("", "integer")).toBe("validation.required");
    expect(defaultValueError("   ", "boolean")).toBe("validation.required");
  });
});

describe("isDuplicateParameterName", () => {
  it("flags a name that appears more than once (after trimming)", () => {
    const params = [
      { name: "replicas" },
      { name: " replicas " },
      { name: "env" },
    ];
    expect(isDuplicateParameterName(params, "replicas")).toBe(true);
    expect(isDuplicateParameterName(params, "env")).toBe(false);
  });

  it("is case-sensitive (object keys differ by case)", () => {
    const params = [{ name: "Replicas" }, { name: "replicas" }];
    expect(isDuplicateParameterName(params, "replicas")).toBe(false);
  });

  it("ignores blank names", () => {
    expect(isDuplicateParameterName([{ name: "" }, { name: "" }], "")).toBe(
      false
    );
  });
});
