import { describe, it, expect, beforeEach } from "vitest";
import { buildSchema, GraphQLSchema } from "graphql";
import { ScalarHandler } from "../ScalarHandler";
import { PluginConfig } from "../../config/PluginConfig";

describe("ScalarHandler", () => {
    let schema: GraphQLSchema;
    let config: PluginConfig;

    beforeEach(() => {
        schema = buildSchema(`
            scalar Date
            scalar UUID
            scalar JSON

            type Query {
                hello: String
            }
        `);
    });

    describe("generateMockValue", () => {
        it("should generate actual mock values for primitive String scalar", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);
            const result = handler.generateMockValue("String");
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        it("should generate actual mock values for primitive Int scalar", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);
            const result = handler.generateMockValue("Int");
            expect(typeof result).toBe("number");
            expect(Number.isInteger(result as number)).toBe(true);
        });

        it("should generate actual mock values for primitive Float scalar", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);
            const result = handler.generateMockValue("Float");
            expect(typeof result).toBe("number");
        });

        it("should generate actual mock values for primitive Boolean scalar", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);
            const result = handler.generateMockValue("Boolean");
            expect(typeof result).toBe("boolean");
        });

        it("should generate actual mock values for primitive ID scalar", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);
            const result = handler.generateMockValue("ID");
            expect(typeof result).toBe("string");
            // UUID format check
            expect(result).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
        });
    });

    describe("custom scalar handling", () => {
        it("should handle configured custom scalars with string config", () => {
            config = new PluginConfig({
                scalars: {
                    Date: "date",
                    UUID: "uuid",
                },
            });
            const handler = new ScalarHandler(config);

            const dateResult = handler.generateMockValue("Date");
            expect(typeof dateResult).toBe("string");

            const uuidResult = handler.generateMockValue("UUID");
            expect(typeof uuidResult).toBe("string");
            expect(uuidResult).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
        });

        it("should handle configured custom scalars with object config", () => {
            config = new PluginConfig({
                scalars: {
                    Date: {
                        generator: "date",
                        arguments: ["YYYY-MM-DD"],
                    },
                    JSON: {
                        generator: "sentence",
                        arguments: [],
                    },
                },
            });
            const handler = new ScalarHandler(config);

            const dateResult = handler.generateMockValue("Date");
            expect(typeof dateResult).toBe("string");

            const jsonResult = handler.generateMockValue("JSON");
            expect(typeof jsonResult).toBe("string");
        });

        it("should fallback to default mock for unconfigured custom scalars", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);

            const result = handler.generateMockValue("Date");
            expect(result).toBe("date-mock");
        });

        it("should handle scalars with invalid casual generator gracefully", () => {
            config = new PluginConfig({
                scalars: {
                    Date: "nonexistent_generator",
                },
            });
            const handler = new ScalarHandler(config);

            expect(() => handler.generateMockValue("Date")).toThrow();
        });
    });

    describe("edge cases", () => {
        it("should handle empty scalar configuration", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);

            // Should not crash with undefined/null scalar configs
            expect(() => handler.generateMockValue("String")).not.toThrow();
            expect(() => handler.generateMockValue("Date")).not.toThrow();
        });

        it("should handle unknown scalar types", () => {
            config = new PluginConfig({});
            const handler = new ScalarHandler(config);

            const result = handler.generateMockValue("UnknownScalar");
            expect(result).toBe("unknownscalar-mock");
        });
    });
});
