import { describe, it, expect } from "vitest";
import { buildSchema } from "graphql";
import { validate } from "../validate";
import type { TypeScriptMockDataPluginConfig } from "../config/types";

describe("validate", () => {
    const schemaWithCustomScalars = buildSchema(`
    scalar DateTime
    scalar EmailAddress
    scalar UUID

    type User {
      id: UUID!
      email: EmailAddress!
      createdAt: DateTime!
      name: String!
      age: Int!
      isActive: Boolean!
    }

    type Query {
      user(id: UUID!): User
    }
  `);

    const schemaWithoutCustomScalars = buildSchema(`
    type User {
      id: ID!
      name: String!
      age: Int!
      isActive: Boolean!
      score: Float!
    }

    type Query {
      user(id: ID!): User
    }
  `);

    describe("with custom scalars in schema", () => {
        it("should pass validation when all custom scalars have mock configurations", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    DateTime: "date",
                    EmailAddress: "email",
                    UUID: "uuid",
                },
            };

            expect(() =>
                validate(schemaWithCustomScalars, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should throw error when custom scalars are missing mock configurations", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    DateTime: "date",
                    // Missing EmailAddress and UUID
                },
            };

            expect(() =>
                validate(schemaWithCustomScalars, [], config, "test.ts", []),
            ).toThrow(
                "Missing scalar mock definitions for: EmailAddress, UUID",
            );
        });

        it("should throw error when no scalar configurations are provided", () => {
            const config: TypeScriptMockDataPluginConfig = {};

            expect(() =>
                validate(schemaWithCustomScalars, [], config, "test.ts", []),
            ).toThrow(
                "Missing scalar mock definitions for: DateTime, EmailAddress, UUID",
            );
        });

        it("should throw error when scalars config is empty object", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {},
            };

            expect(() =>
                validate(schemaWithCustomScalars, [], config, "test.ts", []),
            ).toThrow(
                "Missing scalar mock definitions for: DateTime, EmailAddress, UUID",
            );
        });
    });

    describe("with built-in scalars only", () => {
        it("should pass validation when schema only has built-in scalars", () => {
            const config: TypeScriptMockDataPluginConfig = {};

            expect(() =>
                validate(schemaWithoutCustomScalars, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should pass validation with empty scalars config when no custom scalars exist", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {},
            };

            expect(() =>
                validate(schemaWithoutCustomScalars, [], config, "test.ts", []),
            ).not.toThrow();
        });
    });

    describe("scalar configuration validation", () => {
        const simpleSchema = buildSchema(`
      scalar CustomScalar
      type Query { test: String }
    `);

        it("should validate string-based scalar configurations", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: "word",
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should throw error for invalid casual.js generator names in string config", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: "invalidGenerator",
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Invalid casual.js generator "invalidGenerator" for scalar "CustomScalar"',
            );
        });

        it("should validate object-based scalar configurations", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "integer",
                        arguments: [1, 100],
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should validate object config with string arguments", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "word",
                        arguments: "custom-arg",
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should validate object config with number arguments", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "integer",
                        arguments: 42,
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should validate object config without arguments", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "word",
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).not.toThrow();
        });

        it("should throw error for object config missing generator property", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        arguments: ["test"],
                    } as any,
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Scalar "CustomScalar" must have a "generator" property with a string value',
            );
        });

        it("should throw error for object config with non-string generator", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: 123 as any,
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Scalar "CustomScalar" must have a "generator" property with a string value',
            );
        });

        it("should throw error for invalid casual.js generator in object config", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "invalidGenerator",
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Invalid casual.js generator "invalidGenerator" for scalar "CustomScalar"',
            );
        });

        it("should throw error for invalid arguments type in object config", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: {
                        generator: "word",
                        arguments: { invalid: true } as any,
                    },
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Arguments for scalar "CustomScalar" must be a string, number, or array',
            );
        });

        it("should throw error for invalid scalar configuration type", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: 123 as any,
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Invalid configuration for scalar "CustomScalar". Expected string or object with generator property.',
            );
        });

        it("should throw error for null scalar configuration", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomScalar: null as any,
                },
            };

            expect(() =>
                validate(simpleSchema, [], config, "test.ts", []),
            ).toThrow(
                'Invalid configuration for scalar "CustomScalar". Expected string or object with generator property.',
            );
        });
    });
});
