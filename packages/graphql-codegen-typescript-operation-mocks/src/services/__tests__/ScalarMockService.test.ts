import { describe, it, expect } from "vitest";
import { ScalarMockService } from "../ScalarMockService";
import type { TypeScriptMockDataPluginConfig } from "../../config/types";

describe("ScalarMockService", () => {
    const service = new ScalarMockService();

    describe("primitive scalars", () => {
        it("should generate deterministic ID for ID scalar with context", () => {
            const result1 = service.generateMockValue("ID", {}, "TestBuilder");
            const result2 = service.generateMockValue("ID", {}, "TestBuilder");
            const result3 = service.generateMockValue(
                "ID",
                {},
                "DifferentBuilder",
            );

            expect(typeof result1).toBe("string");
            expect(result1).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
            // Same context should produce same ID
            expect(result1).toBe(result2);
            // Different context should produce different ID
            expect(result1).not.toBe(result3);
        });

        it("should generate random UUID for ID scalar without context", () => {
            const result = service.generateMockValue("ID", {});
            expect(typeof result).toBe("string");
            expect(result).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            );
        });

        it("should generate string for String scalar", () => {
            const result = service.generateMockValue("String", {});
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        it("should generate integer for Int scalar", () => {
            const result = service.generateMockValue("Int", {});
            expect(typeof result).toBe("number");
            expect(Number.isInteger(result as number)).toBe(true);
        });

        it("should generate float for Float scalar", () => {
            const result = service.generateMockValue("Float", {});
            expect(typeof result).toBe("number");
        });

        it("should always generate true for Boolean scalar", () => {
            const result1 = service.generateMockValue("Boolean", {});
            const result2 = service.generateMockValue("Boolean", {});
            const result3 = service.generateMockValue("Boolean", {});

            expect(result1).toBe(true);
            expect(result2).toBe(true);
            expect(result3).toBe(true);
        });
    });

    describe("enum values", () => {
        it("should generate first enum value", () => {
            const enumValues = ["ACTIVE", "INACTIVE", "PENDING"];
            const result = service.generateEnumValue(enumValues);
            expect(result).toBe("ACTIVE");
        });

        it("should handle single enum value", () => {
            const enumValues = ["ONLY_VALUE"];
            const result = service.generateEnumValue(enumValues);
            expect(result).toBe("ONLY_VALUE");
        });

        it("should throw error for empty enum values", () => {
            expect(() => service.generateEnumValue([])).toThrow(
                "Enum type has no values",
            );
        });
    });

    describe("custom scalars", () => {
        it("should use string configuration", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    Date: "date",
                    Email: "email",
                },
            };

            const dateResult = service.generateMockValue("Date", config);
            expect(typeof dateResult).toBe("string");

            const emailResult = service.generateMockValue("Email", config);
            expect(typeof emailResult).toBe("string");
            expect(emailResult).toMatch(/@/); // Should contain @ symbol
        });

        it("should use object configuration with arguments", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    CustomDate: {
                        generator: "date",
                        arguments: ["YYYY-MM-DD"],
                    },
                    CustomInt: {
                        generator: "integer",
                        arguments: [1, 100],
                    },
                },
            };

            const dateResult = service.generateMockValue("CustomDate", config);
            expect(typeof dateResult).toBe("string");

            const intResult = service.generateMockValue("CustomInt", config);
            expect(typeof intResult).toBe("number");
        });

        it("should use object configuration without arguments", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    SimpleCustom: {
                        generator: "word",
                    },
                },
            };

            const result = service.generateMockValue("SimpleCustom", config);
            expect(typeof result).toBe("string");
        });

        it("should fallback for unknown custom scalars", () => {
            const result = service.generateMockValue("UnknownScalar", {});
            expect(result).toBe("unknownscalar-mock");
        });
    });

    describe("error handling", () => {
        it("should throw for invalid casual generator in string config", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    BadScalar: "invalidGenerator",
                },
            };

            expect(() =>
                service.generateMockValue("BadScalar", config),
            ).toThrow('Invalid casual generator "invalidGenerator"');
        });

        it("should throw for invalid casual generator in object config", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    BadScalar: {
                        generator: "invalidGenerator",
                    },
                },
            };

            expect(() =>
                service.generateMockValue("BadScalar", config),
            ).toThrow('Invalid casual generator "invalidGenerator"');
        });

        it("should throw for invalid scalar config type", () => {
            const config: TypeScriptMockDataPluginConfig = {
                scalars: {
                    BadScalar: 123 as any, // Invalid config type
                },
            };

            expect(() =>
                service.generateMockValue("BadScalar", config),
            ).toThrow("Unknown scalar config");
        });
    });
});
