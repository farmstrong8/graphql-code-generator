import { describe, it, expect } from "vitest";
import { TypeDefinitionService } from "../TypeDefinitionService";

describe("TypeDefinitionService", () => {
    const service = new TypeDefinitionService();

    describe("primitive types", () => {
        it("should convert null to null type", () => {
            expect(service.generateTypeFromValue(null)).toBe("null");
            expect(service.generateTypeFromValue(undefined)).toBe("null");
        });

        it("should convert strings to string literal types", () => {
            expect(service.generateTypeFromValue("hello")).toBe('"hello"');
            expect(service.generateTypeFromValue("")).toBe('""');
        });

        it("should escape special characters in strings", () => {
            expect(service.generateTypeFromValue('say "hello"')).toBe(
                '"say \\"hello\\""',
            );
            expect(service.generateTypeFromValue("line1\nline2")).toBe(
                '"line1\\nline2"',
            );
            expect(service.generateTypeFromValue("path\\to\\file")).toBe(
                '"path\\\\to\\\\file"',
            );
        });

        it("should convert numbers to number literal types", () => {
            expect(service.generateTypeFromValue(42)).toBe("42");
            expect(service.generateTypeFromValue(3.14)).toBe("3.14");
            expect(service.generateTypeFromValue(0)).toBe("0");
            expect(service.generateTypeFromValue(-10)).toBe("-10");
        });

        it("should convert booleans to boolean literal types", () => {
            expect(service.generateTypeFromValue(true)).toBe("true");
            expect(service.generateTypeFromValue(false)).toBe("false");
        });
    });

    describe("array types", () => {
        it("should convert empty arrays to unknown[]", () => {
            expect(service.generateTypeFromValue([])).toBe("unknown[]");
        });

        it("should convert arrays to Array<T> with element type", () => {
            expect(service.generateTypeFromValue(["hello"])).toBe(
                'Array<"hello">',
            );
            expect(service.generateTypeFromValue([42])).toBe("Array<42>");
            expect(service.generateTypeFromValue([true])).toBe("Array<true>");
        });

        it("should infer array type from first element", () => {
            expect(service.generateTypeFromValue(["first", "second"])).toBe(
                'Array<"first">',
            );
            expect(service.generateTypeFromValue([1, 2, 3])).toBe("Array<1>");
        });

        it("should handle nested arrays", () => {
            expect(service.generateTypeFromValue([["nested"]])).toBe(
                'Array<Array<"nested">>',
            );
        });
    });

    describe("object types", () => {
        it("should convert simple objects to type definitions", () => {
            const result = service.generateTypeFromValue({
                id: "123",
                name: "John",
                active: true,
            });

            expect(result).toBe(
                `{\n  id: "123",\n  name: "John",\n  active: true\n}`,
            );
        });

        it("should handle empty objects", () => {
            expect(service.generateTypeFromValue({})).toBe("{\n  \n}");
        });

        it("should quote keys that need quotes", () => {
            const result = service.generateTypeFromValue({
                "123": "numeric key",
                "kebab-case": "hyphenated",
                __typename: "User",
                "space key": "spaced",
                normalKey: "normal",
            });

            expect(result).toContain('"123": "numeric key"');
            expect(result).toContain('"kebab-case": "hyphenated"');
            expect(result).toContain('"__typename": "User"');
            expect(result).toContain('"space key": "spaced"');
            expect(result).toContain('normalKey: "normal"');
        });

        it("should handle nested objects", () => {
            const result = service.generateTypeFromValue({
                user: {
                    profile: {
                        name: "John",
                    },
                },
            });

            expect(result).toContain("user: {");
            expect(result).toContain("profile: {");
            expect(result).toContain('name: "John"');
        });
    });

    describe("complex types", () => {
        it("should handle arrays of objects", () => {
            const result = service.generateTypeFromValue([
                { id: "1", name: "User1" },
            ]);

            expect(result).toBe('Array<{\n  id: "1",\n  name: "User1"\n}>');
        });

        it("should handle objects with arrays", () => {
            const result = service.generateTypeFromValue({
                users: ["Alice", "Bob"],
                scores: [100, 200],
            });

            expect(result).toContain('users: Array<"Alice">');
            expect(result).toContain("scores: Array<100>");
        });

        it("should handle mixed nested structures", () => {
            const result = service.generateTypeFromValue({
                data: {
                    items: [{ id: 1 }],
                    meta: {
                        count: 10,
                        tags: ["tag1"],
                    },
                },
            });

            expect(result).toContain("data: {");
            expect(result).toContain("items: Array<{");
            expect(result).toContain("meta: {");
        });
    });

    describe("generateNamedTypeDefinition", () => {
        it("should generate complete type definitions", () => {
            const result = service.generateNamedTypeDefinition("User", {
                id: "123",
                name: "John",
            });

            expect(result).toBe(
                'type User = {\n  id: "123",\n  name: "John"\n};',
            );
        });

        it("should use schema type body when provided", () => {
            const result = service.generateNamedTypeDefinition(
                "User",
                { id: "123" },
                { schemaTypeBody: "{ id: string; name: string }" },
            );

            expect(result).toBe("type User = { id: string; name: string };");
        });
    });

    describe("edge cases", () => {
        it("should handle unknown values", () => {
            const result = service.generateTypeFromValue(Symbol("test"));
            expect(result).toBe("unknown");
        });

        it("should handle functions", () => {
            const result = service.generateTypeFromValue(() => {});
            expect(result).toBe("unknown");
        });

        it("should handle Date objects", () => {
            const result = service.generateTypeFromValue(new Date());
            expect(result).toContain("{"); // Converted as object
        });
    });
});
