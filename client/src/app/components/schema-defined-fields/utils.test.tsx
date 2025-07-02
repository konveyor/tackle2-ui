import { t } from "i18next";

import { jsonSchemaToYupSchema, isComplexSchema } from "./utils";

describe("jsonSchemaToYupSchema", () => {
  it("should return a yup schema", () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };
    expect(jsonSchemaToYupSchema(schema, t)).toBeDefined();
  });
});

describe("jsonSchemaToYupSchema integration", () => {
  it("validates a simple object schema with one string property", async () => {
    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const yupSchema = jsonSchemaToYupSchema(schema, t);

    await expect(yupSchema.validate({ name: "Alice" })).resolves.toEqual({
      name: "Alice",
    });

    await expect(yupSchema.validate({})).rejects.toThrow();
  });

  it("validates a simple object schema with one number property", async () => {
    const schema = {
      type: "object",
      properties: {
        age: { type: "number" },
      },
      required: ["age"],
    };

    const yupSchema = jsonSchemaToYupSchema(schema, t);

    await expect(yupSchema.validate({ age: 42 })).resolves.toEqual({ age: 42 });

    await expect(yupSchema.validate({})).rejects.toThrow();

    await expect(yupSchema.validate({ age: "not a number" })).rejects.toThrow();
  });
});

describe("isComplexSchema", () => {
  it("returns false for simple string schema", () => {
    const schema = { type: "string" };
    expect(isComplexSchema(schema)).toBe(false);
  });

  it("returns false for simple number schema", () => {
    const schema = { type: "number" };
    expect(isComplexSchema(schema)).toBe(false);
  });

  it("returns true for array of objects", () => {
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          foo: { type: "string" },
        },
      },
    };
    expect(isComplexSchema(schema)).toBe(true);
  });
});
