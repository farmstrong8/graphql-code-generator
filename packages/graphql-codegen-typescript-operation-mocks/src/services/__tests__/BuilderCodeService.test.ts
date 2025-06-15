import { describe, it, expect } from "vitest";
import { BuilderCodeService } from "../BuilderCodeService";

describe("BuilderCodeService", () => {
    const service = new BuilderCodeService();

    describe("generateBuilderFunction", () => {
        it("should generate simple builder function", () => {
            const result = service.generateBuilderFunction("aUser", "User", {
                id: "123",
                name: "John",
            });

            expect(result).toBe(
                'export const aUser = createBuilder<User>({\n  id: "123",\n  name: "John"\n});',
            );
        });

        it("should generate builder with primitive values", () => {
            const result = service.generateBuilderFunction("aStats", "Stats", {
                count: 42,
                active: true,
                score: null,
            });

            expect(result).toContain("count: 42");
            expect(result).toContain("active: true");
            expect(result).toContain("score: null");
        });

        it("should handle arrays in builder", () => {
            const result = service.generateBuilderFunction(
                "aUserList",
                "UserList",
                {
                    users: ["Alice", "Bob"],
                    ids: [1, 2, 3],
                },
            );

            expect(result).toContain('users: ["Alice", "Bob"]');
            expect(result).toContain("ids: [1, 2, 3]");
        });
    });

    describe("generateMockValueLiteral", () => {
        it("should convert primitive values to literals", () => {
            expect(service.generateMockValueLiteral("hello")).toBe('"hello"');
            expect(service.generateMockValueLiteral(42)).toBe("42");
            expect(service.generateMockValueLiteral(true)).toBe("true");
            expect(service.generateMockValueLiteral(null)).toBe("null");
            expect(service.generateMockValueLiteral(undefined)).toBe("null");
        });

        it("should escape strings properly", () => {
            expect(service.generateMockValueLiteral('say "hello"')).toBe(
                '"say \\"hello\\""',
            );
            expect(service.generateMockValueLiteral("line1\nline2")).toBe(
                '"line1\\nline2"',
            );
            expect(service.generateMockValueLiteral("path\\file")).toBe(
                '"path\\\\file"',
            );
        });

        it("should handle arrays", () => {
            expect(service.generateMockValueLiteral([])).toBe("[]");
            expect(service.generateMockValueLiteral(["a", "b"])).toBe(
                '["a", "b"]',
            );
            expect(service.generateMockValueLiteral([1, 2, 3])).toBe(
                "[1, 2, 3]",
            );
            expect(service.generateMockValueLiteral([true, false])).toBe(
                "[true, false]",
            );
        });

        it("should handle nested arrays", () => {
            expect(service.generateMockValueLiteral([["nested"]])).toBe(
                '[["nested"]]',
            );
        });

        it("should handle simple objects", () => {
            const result = service.generateMockValueLiteral({
                id: "123",
                count: 42,
                active: true,
            });

            expect(result).toBe(
                '{\n  id: "123",\n  count: 42,\n  active: true\n}',
            );
        });

        it("should quote keys that need quotes", () => {
            const result = service.generateMockValueLiteral({
                "123": "numeric",
                "kebab-case": "hyphenated",
                __typename: "User",
                normalKey: "normal",
            });

            expect(result).toContain('"123": "numeric"');
            expect(result).toContain('"kebab-case": "hyphenated"');
            expect(result).toContain('"__typename": "User"');
            expect(result).toContain('normalKey: "normal"');
        });
    });

    describe("nested builders", () => {
        it("should use nested builders when available", () => {
            const nestedBuilders = new Map([["User", "aGetUserUser"]]);

            const result = service.generateMockValueLiteral(
                {
                    profile: {
                        __typename: "User",
                        id: "123",
                    },
                },
                { nestedBuilders },
            );

            expect(result).toContain("profile: aGetUserUser()");
        });

        it("should fallback to object literal when no nested builder", () => {
            const nestedBuilders = new Map([["Post", "aPost"]]);

            const result = service.generateMockValueLiteral(
                {
                    user: {
                        __typename: "User", // No builder for User
                        id: "123",
                    },
                },
                { nestedBuilders },
            );

            expect(result).toContain('"__typename": "User"');
            expect(result).toContain('id: "123"');
            expect(result).not.toContain("aPost()");
        });

        it("should handle mixed nested and inline objects", () => {
            const nestedBuilders = new Map([["User", "aUser"]]);

            const result = service.generateMockValueLiteral(
                {
                    user: {
                        __typename: "User",
                        id: "123",
                    },
                    meta: {
                        count: 10,
                        active: true,
                    },
                },
                { nestedBuilders },
            );

            expect(result).toContain("user: aUser()");
            expect(result).toContain("count: 10");
            expect(result).toContain("active: true");
        });
    });

    describe("complex structures", () => {
        it("should handle arrays of objects", () => {
            const result = service.generateMockValueLiteral([
                { id: "1", name: "User1" },
                { id: "2", name: "User2" },
            ]);

            expect(result).toBe(
                '[{\n  id: "1",\n  name: "User1"\n}, {\n  id: "2",\n  name: "User2"\n}]',
            );
        });

        it("should handle arrays with nested builders", () => {
            const nestedBuilders = new Map([["User", "aUser"]]);

            const result = service.generateMockValueLiteral(
                [
                    { __typename: "User", id: "1" },
                    { __typename: "User", id: "2" },
                ],
                { nestedBuilders },
            );

            expect(result).toBe("[aUser(), aUser()]");
        });

        it("should handle deeply nested structures", () => {
            const result = service.generateMockValueLiteral({
                data: {
                    users: [
                        {
                            profile: {
                                name: "John",
                                settings: {
                                    theme: "dark",
                                },
                            },
                        },
                    ],
                },
            });

            expect(result).toContain("data: {");
            expect(result).toContain("users: [");
            expect(result).toContain("profile: {");
            expect(result).toContain('name: "John"');
            expect(result).toContain("settings: {");
            expect(result).toContain('theme: "dark"');
        });
    });

    describe("edge cases", () => {
        it("should handle empty objects", () => {
            expect(service.generateMockValueLiteral({})).toBe("{\n  \n}");
        });

        it("should handle objects with null values", () => {
            const result = service.generateMockValueLiteral({
                name: "John",
                email: null,
                age: undefined,
            });

            expect(result).toContain('name: "John"');
            expect(result).toContain("email: null");
            expect(result).toContain("age: null");
        });

        it("should handle unknown types", () => {
            expect(service.generateMockValueLiteral(Symbol("test"))).toBe(
                "null",
            );
            expect(service.generateMockValueLiteral(() => {})).toBe("null");
        });
    });
});
