import { JsonSchemaObject } from "@app/api/models";

import {
  combineSchemas,
  isEquivalentSchema,
  stripAnnotations,
  validatorGenerator,
} from "./json-schema";

describe("stripAnnotations", () => {
  it("returns primitives as-is", () => {
    expect(stripAnnotations("test")).toBe("test");
    expect(stripAnnotations(42)).toBe(42);
    expect(stripAnnotations(true)).toBe(true);
    expect(stripAnnotations(false)).toBe(false);
  });

  it("returns null as-is", () => {
    expect(stripAnnotations(null)).toBe(null);
  });

  it("returns undefined as-is", () => {
    expect(stripAnnotations(undefined)).toBe(undefined);
  });

  it("strips annotation keywords from a simple object", () => {
    const schema = {
      type: "string",
      title: "User Name",
      description: "The name of the user",
      minLength: 1,
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "string",
      minLength: 1,
    });
  });

  it("strips all annotation keywords", () => {
    const schema = {
      type: "object",
      title: "Test",
      description: "A test object",
      default: { foo: "bar" },
      examples: [{ foo: "baz" }],
      $comment: "This is a comment",
      deprecated: true,
      readOnly: true,
      writeOnly: false,
      properties: {
        name: { type: "string" },
      },
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
      },
    });
  });

  it("preserves $schema keyword", () => {
    const schema = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      title: "Should be removed",
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
    });
  });

  it("recursively strips annotations from nested objects", () => {
    const schema = {
      type: "object",
      title: "User",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "User's name",
          minLength: 1,
        },
        profile: {
          type: "object",
          description: "User profile",
          properties: {
            age: {
              type: "number",
              title: "Age",
              minimum: 0,
            },
          },
        },
      },
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1,
        },
        profile: {
          type: "object",
          properties: {
            age: {
              type: "number",
              minimum: 0,
            },
          },
        },
      },
    });
  });

  it("strips annotations from array items", () => {
    const schema = {
      type: "array",
      title: "Tags",
      description: "List of tags",
      items: {
        type: "string",
        title: "Tag",
        description: "A single tag",
        minLength: 1,
      },
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
    });
  });

  it("handles arrays of schemas", () => {
    const schemas = [
      {
        type: "string",
        title: "First",
        minLength: 1,
      },
      {
        type: "number",
        description: "Second",
        minimum: 0,
      },
    ];

    const result = stripAnnotations(schemas);
    expect(result).toEqual([
      {
        type: "string",
        minLength: 1,
      },
      {
        type: "number",
        minimum: 0,
      },
    ]);
  });

  it("handles empty objects", () => {
    const schema = {};
    const result = stripAnnotations(schema);
    expect(result).toEqual({});
  });

  it("handles empty arrays", () => {
    const schema: JsonSchemaObject[] = [];
    const result = stripAnnotations(schema);
    expect(result).toEqual([]);
  });

  it("preserves required array", () => {
    const schema = {
      type: "object",
      title: "User",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    });
  });

  it("preserves validation keywords like minLength, maxLength, pattern", () => {
    const schema = {
      type: "string",
      title: "Email",
      description: "User's email address",
      minLength: 5,
      maxLength: 100,
      pattern: "^[a-z]+@[a-z]+\\.[a-z]+$",
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "string",
      minLength: 5,
      maxLength: 100,
      pattern: "^[a-z]+@[a-z]+\\.[a-z]+$",
    });
  });

  it("preserves numeric validation keywords", () => {
    const schema = {
      type: "number",
      title: "Age",
      minimum: 0,
      maximum: 120,
      multipleOf: 1,
      exclusiveMinimum: false,
      exclusiveMaximum: true,
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "number",
      minimum: 0,
      maximum: 120,
      multipleOf: 1,
      exclusiveMinimum: false,
      exclusiveMaximum: true,
    });
  });

  it("handles complex nested structures with mixed arrays and objects", () => {
    const schema = {
      type: "object",
      title: "Complex Schema",
      properties: {
        users: {
          type: "array",
          description: "List of users",
          items: {
            type: "object",
            title: "User",
            properties: {
              name: {
                type: "string",
                description: "Name",
                minLength: 1,
              },
              tags: {
                type: "array",
                description: "Tags",
                items: {
                  type: "string",
                  title: "Tag",
                },
              },
            },
          },
        },
      },
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({
      type: "object",
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
              },
              tags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    });
  });

  it("does not mutate the original schema", () => {
    const original = {
      type: "string",
      title: "Test",
      description: "A test",
      minLength: 1,
    };
    const originalCopy = { ...original };

    stripAnnotations(original);

    expect(original).toEqual(originalCopy);
  });

  it("handles schemas with only annotation keywords", () => {
    const schema = {
      title: "Only Annotations",
      description: "This has only annotations",
      examples: ["example1", "example2"],
    };

    const result = stripAnnotations(schema);
    expect(result).toEqual({});
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

describe("isEquivalentSchema", () => {
  it("returns true for identical schemas", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        age: { type: "number", minimum: 0 },
      },
      required: ["name"],
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        age: { type: "number", minimum: 0 },
      },
      required: ["name"],
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });

  it("returns true for schemas that differ only in annotations", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      title: "User Schema",
      description: "A schema for users",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "User's name",
          minLength: 1,
        },
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      title: "Person Schema",
      description: "A schema for persons",
      properties: {
        name: {
          type: "string",
          title: "Full Name",
          description: "Person's full name",
          minLength: 1,
        },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });

  it("returns false for schemas with different types", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    const schemaB: JsonSchemaObject = {
      type: "array",
      items: { type: "string" },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("returns false for schemas with different properties", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("returns false for schemas with different validation rules", () => {
    const schemaA: JsonSchemaObject = {
      type: "string",
      minLength: 1,
      maxLength: 10,
    };
    const schemaB: JsonSchemaObject = {
      type: "string",
      minLength: 1,
      maxLength: 20,
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("returns false for schemas with different required fields", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name"],
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("returns true when property order differs", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        email: { type: "string" },
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        email: { type: "string" },
        name: { type: "string" },
        age: { type: "number" },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });

  it("returns true for nested schemas differing only in annotations", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          title: "User Info",
          properties: {
            name: { type: "string", description: "Name field" },
          },
        },
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          title: "User Data",
          properties: {
            name: { type: "string", description: "Full name field" },
          },
        },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });

  it("returns false for nested schemas with different structure", () => {
    const schemaA: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
        },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("returns true for array schemas differing only in annotations", () => {
    const schemaA: JsonSchemaObject = {
      type: "array",
      title: "Tags",
      items: {
        type: "string",
        description: "A tag",
        minLength: 1,
      },
    };
    const schemaB: JsonSchemaObject = {
      type: "array",
      title: "Labels",
      items: {
        type: "string",
        description: "A label",
        minLength: 1,
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });

  it("returns false for array schemas with different item types", () => {
    const schemaA: JsonSchemaObject = {
      type: "array",
      items: { type: "string" },
    };
    const schemaB: JsonSchemaObject = {
      type: "array",
      items: { type: "number" },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(false);
  });

  it("handles complex Cloud Foundry schema with annotations", () => {
    const schemaA: JsonSchemaObject = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      title: "Cloud Foundry Filter",
      properties: {
        organizations: {
          title: "Organizations",
          description: "Organization names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        spaces: {
          title: "Spaces",
          description: "Space names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        names: {
          title: "Application Names",
          description: "Application names. Each may be a glob expression.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
      },
    };

    const schemaB: JsonSchemaObject = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        organizations: {
          description: "Org names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        spaces: {
          description: "Space names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        names: {
          description: "App names. Glob expressions allowed.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
      },
    };

    expect(isEquivalentSchema(schemaA, schemaB)).toBe(true);
  });
});

describe("validatorGenerator", () => {
  it("generates a validator that returns true for equivalent schemas", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    expect(validator(testSchema)).toBe(true);
  });

  it("generates a validator that ignores annotations in base schema", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      title: "User",
      description: "A user schema",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    expect(validator(testSchema)).toBe(true);
  });

  it("generates a validator that ignores annotations in test schema", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      title: "Person",
      description: "A person schema",
      properties: {
        name: {
          type: "string",
          title: "Name",
          description: "Person's name",
          minLength: 1,
        },
      },
    };

    expect(validator(testSchema)).toBe(true);
  });

  it("generates a validator that returns false for non-equivalent schemas", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string", minLength: 5 },
      },
    };

    expect(validator(testSchema)).toBe(false);
  });

  it("generates a validator that returns false for different types", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: { name: { type: "string" } },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "array",
      items: { type: "string" },
    };

    expect(validator(testSchema)).toBe(false);
  });

  it("generates a validator that returns false for missing properties", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    expect(validator(testSchema)).toBe(false);
  });

  it("generates a validator that returns false for extra properties", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };

    expect(validator(testSchema)).toBe(false);
  });

  it("generates a validator that returns false for different required fields", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name"],
    };

    const validator = validatorGenerator(baseSchema);

    const testSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };

    expect(validator(testSchema)).toBe(false);
  });

  it("generates a reusable validator for multiple comparisons", () => {
    const baseSchema: JsonSchemaObject = {
      type: "string",
      minLength: 1,
      maxLength: 100,
    };

    const validator = validatorGenerator(baseSchema);

    const validSchema1: JsonSchemaObject = {
      type: "string",
      title: "Name",
      minLength: 1,
      maxLength: 100,
    };

    const validSchema2: JsonSchemaObject = {
      type: "string",
      description: "A string value",
      minLength: 1,
      maxLength: 100,
    };

    const invalidSchema: JsonSchemaObject = {
      type: "string",
      minLength: 1,
      maxLength: 50,
    };

    expect(validator(validSchema1)).toBe(true);
    expect(validator(validSchema2)).toBe(true);
    expect(validator(invalidSchema)).toBe(false);
  });

  it("generates a validator for Cloud Foundry schema", () => {
    const baseSchema: JsonSchemaObject = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        organizations: {
          description: "Organization names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        spaces: {
          description: "Space names.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        names: {
          description: "Application names. Each may be a glob expression.",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const validSchema: JsonSchemaObject = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      title: "CF Filter",
      properties: {
        organizations: {
          title: "Orgs",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        spaces: {
          title: "Spaces",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        names: {
          title: "Apps",
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
      },
    };

    const invalidSchema: JsonSchemaObject = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        organizations: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        spaces: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
          minItems: 1,
        },
        // Missing 'names' property
      },
    };

    expect(validator(validSchema)).toBe(true);
    expect(validator(invalidSchema)).toBe(false);
  });

  it("generates a validator that handles nested schemas", () => {
    const baseSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
      },
    };

    const validator = validatorGenerator(baseSchema);

    const validSchema: JsonSchemaObject = {
      type: "object",
      title: "Container",
      properties: {
        user: {
          type: "object",
          title: "User Info",
          properties: {
            name: { type: "string", description: "Name" },
            age: { type: "number", description: "Age" },
          },
        },
      },
    };

    const invalidSchema: JsonSchemaObject = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" }, // Different property
          },
        },
      },
    };

    expect(validator(validSchema)).toBe(true);
    expect(validator(invalidSchema)).toBe(false);
  });
});
