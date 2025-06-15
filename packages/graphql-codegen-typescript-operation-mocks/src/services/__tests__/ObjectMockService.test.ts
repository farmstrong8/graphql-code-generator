import { describe, it, expect, vi } from "vitest";
import { ObjectMockService } from "../ObjectMockService";
import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLBoolean,
    GraphQLNonNull,
    GraphQLList,
    Kind,
} from "graphql";
import type { FieldNode } from "graphql";

describe("ObjectMockService", () => {
    const service = new ObjectMockService();

    // Helper to create a mock field node
    const createFieldNode = (
        name: string,
        hasSelectionSet = false,
    ): FieldNode => ({
        kind: Kind.FIELD,
        name: { kind: Kind.NAME, value: name },
        selectionSet: hasSelectionSet
            ? { kind: Kind.SELECTION_SET, selections: [] }
            : undefined,
    });

    // Helper to create a mock GraphQL object type
    const createMockType = (fields: Record<string, any>) => {
        return {
            name: "TestType",
            getFields: () => fields,
        } as any;
    };

    describe("buildMockObject", () => {
        it("should build simple mock object with scalar fields", () => {
            const mockType = createMockType({
                name: { type: GraphQLString },
                age: { type: GraphQLInt },
                active: { type: GraphQLBoolean },
            });

            const fields = [
                createFieldNode("name"),
                createFieldNode("age"),
                createFieldNode("active"),
            ];

            const result = service.buildMockObject(fields, mockType);

            expect(result).toEqual({
                name: "default-string",
                age: 0,
                active: false,
            });
        });

        it("should use custom scalar value generator", () => {
            const mockType = createMockType({
                id: { type: GraphQLString },
                name: { type: GraphQLString },
            });

            const fields = [createFieldNode("id"), createFieldNode("name")];

            const scalarValueGenerator = vi.fn(
                (typeName: string, field: FieldNode) => {
                    if (field.name.value === "id") return "custom-id-123";
                    if (field.name.value === "name") return "Custom Name";
                    return undefined;
                },
            );

            const result = service.buildMockObject(fields, mockType, {
                scalarValueGenerator,
            });

            expect(result).toEqual({
                id: "custom-id-123",
                name: "Custom Name",
            });
            expect(scalarValueGenerator).toHaveBeenCalledTimes(2);
        });

        it("should handle nested objects with custom builder", () => {
            const mockType = createMockType({
                user: { type: GraphQLString }, // Simplified for test
                profile: { type: GraphQLString },
            });

            const fields = [
                createFieldNode("user", true), // Has selection set
                createFieldNode("profile"),
            ];

            const nestedObjectBuilder = vi.fn((field: FieldNode) => {
                if (field.name.value === "user") {
                    return { id: "nested-user-id", name: "Nested User" };
                }
                return undefined;
            });

            const result = service.buildMockObject(fields, mockType, {
                nestedObjectBuilder,
            });

            expect(result).toEqual({
                user: { id: "nested-user-id", name: "Nested User" },
                profile: "default-string",
            });
            expect(nestedObjectBuilder).toHaveBeenCalledWith(
                fields[0],
                expect.any(Object),
            );
        });

        it("should handle missing fields gracefully", () => {
            const mockType = createMockType({
                existingField: { type: GraphQLString },
            });

            const fields = [
                createFieldNode("existingField"),
                createFieldNode("missingField"),
            ];

            const result = service.buildMockObject(fields, mockType);

            expect(result).toEqual({
                existingField: "default-string",
            });
            // Missing fields should be silently ignored
            expect(result).not.toHaveProperty("missingField");
        });
    });

    describe("generateFieldValue", () => {
        it("should generate default values for scalar types", () => {
            const stringField = { type: GraphQLString };
            const intField = { type: GraphQLInt };
            const boolField = { type: GraphQLBoolean };

            expect(
                service.generateFieldValue(
                    createFieldNode("str"),
                    stringField as any,
                ),
            ).toBe("default-string");
            expect(
                service.generateFieldValue(
                    createFieldNode("num"),
                    intField as any,
                ),
            ).toBe(0);
            expect(
                service.generateFieldValue(
                    createFieldNode("bool"),
                    boolField as any,
                ),
            ).toBe(false);
        });

        it("should handle NonNull types", () => {
            const nonNullStringField = {
                type: new GraphQLNonNull(GraphQLString),
            };

            const result = service.generateFieldValue(
                createFieldNode("required"),
                nonNullStringField as any,
            );

            expect(result).toBe("default-string");
        });

        it("should handle List types", () => {
            const listStringField = { type: new GraphQLList(GraphQLString) };

            const result = service.generateFieldValue(
                createFieldNode("tags"),
                listStringField as any,
            );

            expect(result).toEqual(["default-string"]);
        });

        it("should handle NonNull List types", () => {
            const nonNullListField = {
                type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
            };

            const result = service.generateFieldValue(
                createFieldNode("requiredTags"),
                nonNullListField as any,
            );

            expect(result).toEqual(["default-string"]);
        });
    });

    describe("wrapValueForType", () => {
        it("should wrap values for list types", () => {
            const listType = new GraphQLList(GraphQLString);
            // @ts-ignore - accessing private method for testing
            const result = service.wrapValueForType("test", listType);
            expect(result).toEqual(["test"]);
        });

        it("should handle nested NonNull and List types", () => {
            const complexType = new GraphQLNonNull(
                new GraphQLList(new GraphQLNonNull(GraphQLString)),
            );
            // @ts-ignore - accessing private method for testing
            const result = service.wrapValueForType("test", complexType);
            expect(result).toEqual(["test"]);
        });
    });

    describe("getDefaultValueForType", () => {
        it("should return correct defaults for scalar types", () => {
            // @ts-ignore - accessing private method for testing
            expect(service.getDefaultValueForType(GraphQLString)).toBe(
                "default-string",
            );
            // @ts-ignore - accessing private method for testing
            expect(service.getDefaultValueForType(GraphQLInt)).toBe(0);
            // @ts-ignore - accessing private method for testing
            expect(service.getDefaultValueForType(GraphQLBoolean)).toBe(false);
        });

        it("should handle custom scalar types", () => {
            const customScalar = { name: "DateTime" } as any;
            // @ts-ignore - accessing private method for testing
            expect(service.getDefaultValueForType(customScalar)).toBe(null);
        });
    });

    describe("isListTypeRecursive", () => {
        it("should detect list types", () => {
            expect(
                service.isListTypeRecursive(new GraphQLList(GraphQLString)),
            ).toBe(true);
            expect(service.isListTypeRecursive(GraphQLString)).toBe(false);
        });

        it("should detect nested list types", () => {
            const nestedList = new GraphQLNonNull(
                new GraphQLList(GraphQLString),
            );
            expect(service.isListTypeRecursive(nestedList)).toBe(true);
        });
    });

    describe("extractFieldSelections", () => {
        it("should extract only field selections", () => {
            const selections = [
                {
                    kind: "Field",
                    name: { value: "field1" },
                    selectionSet: undefined,
                    arguments: [],
                    directives: [],
                    alias: undefined,
                },
                {
                    kind: "InlineFragment",
                    typeCondition: {
                        kind: "NamedType",
                        name: { value: "SomeType" },
                    },
                    selectionSet: { kind: "SelectionSet", selections: [] },
                    directives: [],
                },
                {
                    kind: "Field",
                    name: { value: "field2" },
                    selectionSet: undefined,
                    arguments: [],
                    directives: [],
                    alias: undefined,
                },
                {
                    kind: "FragmentSpread",
                    name: { value: "fragment" },
                    directives: [],
                },
            ] as any[];

            const result = service.extractFieldSelections(selections);

            expect(result).toHaveLength(2);
            expect(result[0].name.value).toBe("field1");
            expect(result[1].name.value).toBe("field2");
        });

        it("should handle empty selections", () => {
            expect(service.extractFieldSelections([])).toEqual([]);
        });
    });
});
