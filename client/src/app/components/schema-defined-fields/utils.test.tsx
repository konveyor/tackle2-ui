import {
  jsonSchemaToYupSchema,
  isComplexSchema,
  combineSchemas,
} from "./utils";
import { JsonSchemaObject } from "@app/api/models";

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

describe("combineSchemas", () => {
  it("returns undefined when input is undefined", () => {
    expect(combineSchemas(undefined)).toBeUndefined();
  });

  it("returns undefined when input is null", () => {
    expect(combineSchemas(null as any)).toBeUndefined();
  });

  it("returns a base schema when given an empty array", () => {
    const result = combineSchemas([]);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {},
      required: [],
    });
  });

  it("combines properties from a single object schema", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    });
  });

  it("combines properties from multiple object schemas", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      },
      {
        type: "object",
        properties: {
          email: { type: "string" },
          active: { type: "boolean" },
        },
        required: ["email"],
      },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
        active: { type: "boolean" },
      },
      required: ["name", "email"],
    });
  });

  it("overwrites properties when there are duplicates (later ones win)", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          age: { type: "number" },
        },
      },
      {
        type: "object",
        properties: {
          name: { type: "string", minLength: 5, maxLength: 50 },
          email: { type: "string" },
        },
      },
    ];

    const result = combineSchemas(schemas);
    expect(result?.properties?.name).toEqual({
      type: "string",
      minLength: 5,
      maxLength: 50,
    });
    expect(result?.properties?.age).toEqual({ type: "number" });
    expect(result?.properties?.email).toEqual({ type: "string" });
  });

  it("combines required fields uniquely (no duplicates)", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name", "age"],
      },
      {
        type: "object",
        properties: { email: { type: "string" } },
        required: ["email", "name"], // "name" is duplicate
      },
      {
        type: "object",
        properties: { active: { type: "boolean" } },
        required: ["active"],
      },
    ];

    const result = combineSchemas(schemas);
    expect(result?.required).toEqual(["name", "age", "email", "active"]);
  });

  it("ignores non-object schemas", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "string", // This should be ignored
      },
      {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
      {
        type: "array", // This should be ignored
        items: { type: "string" },
      },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    });
  });

  it("handles schemas without properties", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        required: ["name"],
      },
      {
        type: "object",
        properties: {
          email: { type: "string" },
        },
      },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        email: { type: "string" },
      },
      required: ["name"],
    });
  });

  it("handles schemas without required fields", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      {
        type: "object",
        properties: {
          email: { type: "string" },
        },
        required: ["email"],
      },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["email"],
    });
  });

  it("handles complex nested object properties", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" },
            },
            required: ["name"],
          },
        },
        required: ["user"],
      },
      {
        type: "object",
        properties: {
          settings: {
            type: "object",
            properties: {
              theme: { type: "string" },
              notifications: { type: "boolean" },
            },
          },
        },
      },
    ];

    const result = combineSchemas(schemas);
    expect(result?.properties?.user).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    });
    expect(result?.properties?.settings).toEqual({
      type: "object",
      properties: {
        theme: { type: "string" },
        notifications: { type: "boolean" },
      },
    });
    expect(result?.required).toEqual(["user"]);
  });

  it("handles schemas with array properties", () => {
    const schemas: JsonSchemaObject[] = [
      {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
          },
          name: { type: "string" },
        },
        required: ["name"],
      },
      {
        type: "object",
        properties: {
          scores: {
            type: "array",
            items: { type: "number" },
          },
        },
      },
    ];

    const result = combineSchemas(schemas);
    expect(result?.properties?.tags).toEqual({
      type: "array",
      items: { type: "string" },
    });
    expect(result?.properties?.scores).toEqual({
      type: "array",
      items: { type: "number" },
    });
    expect(result?.properties?.name).toEqual({ type: "string" });
    expect(result?.required).toEqual(["name"]);
  });

  it("returns base schema when all schemas are non-object types", () => {
    const schemas: JsonSchemaObject[] = [
      { type: "string" },
      { type: "number" },
      { type: "boolean" },
    ];

    const result = combineSchemas(schemas);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {},
      required: [],
    });
  });
});
