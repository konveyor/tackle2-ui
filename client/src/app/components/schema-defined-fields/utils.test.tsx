import { JsonSchemaObject } from "@app/api/models";

import { isComplexSchema, jsonSchemaToYupSchema } from "./utils";

describe("jsonSchemaToYupSchema", () => {
  it("should return a yup schema", () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };
    expect(jsonSchemaToYupSchema(schema)).toBeDefined();
  });
});

describe("jsonSchemaToYupSchema integration", () => {
  it("validates a simple object schema with one string property", async () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const ys = jsonSchemaToYupSchema(schema);

    await expect(ys.validate({ name: "Alice" })).resolves.toEqual({
      name: "Alice",
    });
    await expect(
      ys.validate({ name: "Alice", extra: "extra" })
    ).resolves.toEqual({ name: "Alice", extra: "extra" });

    await expect(ys.validate({})).rejects.toThrow();
    await expect(ys.validate({ job: "engineer" })).rejects.toThrow();
  });

  it("validates a simple object schema with one number property", async () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        age: { type: "number" },
      },
      required: ["age"],
    };

    const ys = jsonSchemaToYupSchema(schema);

    await expect(ys.validate({ age: 42 })).resolves.toEqual({ age: 42 });

    await expect(ys.validate({ age: "42" })).rejects.toThrow();
    await expect(ys.validate({})).rejects.toThrow();
    await expect(ys.validate({ age: "not a number" })).rejects.toThrow();
  });

  describe("validate a mildly complex schema", () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 3 },
        location: {
          type: "object",
          properties: {
            host: { type: "string" },
            path: { type: "string" },
          },
          required: ["host"],
        },
      },
      required: ["name"],
    };
    const ys = jsonSchemaToYupSchema(schema);

    const shouldWork = [
      { name: "Alice" },
      { name: "Alice", location: { host: "localhost" } },
      { name: "Alice", location: { host: "localhost", path: "/api" } },
      {
        name: "Alice",
        location: { host: "localhost", path: "/api", extra: "extra" },
      },
      { name: "Alice", extra: 123 },
      { name: "Bob" },
    ];
    for (const test of shouldWork) {
      it(`Valid object: ${JSON.stringify(test)}`, async () => {
        await expect(ys.validate(test)).resolves.toEqual(test);
      });
    }

    const shouldFail = [
      {},
      { name: "A" },
      { name: "Alice", location: {} },
      { name: "Alice", location: { host: "localhost", path: 123 } },
    ];
    for (const test of shouldFail) {
      it(`Invalid object: ${JSON.stringify(test)}`, async () => {
        await expect(ys.validate(test)).rejects.toThrow();
      });
    }
  });

  describe("validates a schema with additionalProperties false", () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: { name: { type: "string" } },
      additionalProperties: false,
    };
    const ys = jsonSchemaToYupSchema(schema);

    const shouldFail = [
      { name: "Alice", extra: "extra" },
      { name: "Alice", extra: 123 },
    ];
    for (const test of shouldFail) {
      it(`Invalid object: ${JSON.stringify(test)}`, async () => {
        await expect(ys.validate(test)).rejects.toThrow();
      });
    }
  });
});

describe("isComplexSchema", () => {
  it("returns false for simple string schema", () => {
    const schema: JsonSchemaObject = { type: "string" };
    expect(isComplexSchema(schema)).toBe(false);
  });

  it("returns false for simple number schema", () => {
    const schema: JsonSchemaObject = { type: "number" };
    expect(isComplexSchema(schema)).toBe(false);
  });

  it("returns false for object of strings", () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        foo: { type: "string" },
        bar: { type: "string" },
      },
    };
    expect(isComplexSchema(schema)).toBe(false);
  });

  it("returns true for array of objects", () => {
    const schema: JsonSchemaObject = {
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

  it("returns true for object with an array property", () => {
    const schema: JsonSchemaObject = {
      type: "object",
      properties: {
        foo: { type: "array", items: { type: "string" } },
      },
    };
    expect(isComplexSchema(schema)).toBe(true);
  });
});
