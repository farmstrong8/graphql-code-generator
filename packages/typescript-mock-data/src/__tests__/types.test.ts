import { describe, it, expect } from "vitest";
import type {
    GeneratedCodeArtifact,
    MockDataObject,
    MockDataVariants,
    CodeArtifactCollection,
} from "../types";

describe("Type Definitions", () => {
    describe("GeneratedCodeArtifact", () => {
        it("should properly type GeneratedCodeArtifact", () => {
            const artifact: GeneratedCodeArtifact = {
                operationName: "GetUser",
                operationType: "query",
                generatedCode: "export const aGetUser = () => ({ ... });",
            };

            expect(artifact.operationName).toBe("GetUser");
            expect(artifact.operationType).toBe("query");
            expect(artifact.generatedCode).toContain("aGetUser");
        });

        it("should accept all operation types", () => {
            const queryArtifact: GeneratedCodeArtifact = {
                operationName: "GetUser",
                operationType: "query",
                generatedCode: "",
            };

            const mutationArtifact: GeneratedCodeArtifact = {
                operationName: "CreateUser",
                operationType: "mutation",
                generatedCode: "",
            };

            const subscriptionArtifact: GeneratedCodeArtifact = {
                operationName: "UserUpdated",
                operationType: "subscription",
                generatedCode: "",
            };

            const fragmentArtifact: GeneratedCodeArtifact = {
                operationName: "UserDetails",
                operationType: "fragment",
                generatedCode: "",
            };

            expect(queryArtifact.operationType).toBe("query");
            expect(mutationArtifact.operationType).toBe("mutation");
            expect(subscriptionArtifact.operationType).toBe("subscription");
            expect(fragmentArtifact.operationType).toBe("fragment");
        });
    });

    describe("MockDataObject", () => {
        it("should properly type MockDataObject", () => {
            const mockData: MockDataObject = {
                mockName: "UserMock",
                mockValue: {
                    id: "123",
                    name: "John Doe",
                    email: "john@example.com",
                    isActive: true,
                    age: 30,
                    tags: ["developer", "typescript"],
                    profile: {
                        bio: "Software developer",
                        location: "San Francisco",
                    },
                },
            };

            expect(mockData.mockName).toBe("UserMock");
            expect(typeof mockData.mockValue).toBe("object");
            expect(mockData.mockValue.id).toBe("123");
            expect(mockData.mockValue.isActive).toBe(true);
            expect(Array.isArray(mockData.mockValue.tags)).toBe(true);
            expect(typeof mockData.mockValue.profile).toBe("object");
        });

        it("should handle complex nested objects", () => {
            const complexMock: MockDataObject = {
                mockName: "ComplexMock",
                mockValue: {
                    users: [
                        { id: "1", name: "Alice" },
                        { id: "2", name: "Bob" },
                    ],
                    metadata: {
                        count: 2,
                        hasNextPage: false,
                    },
                },
            };

            expect(complexMock.mockName).toBe("ComplexMock");
            expect(Array.isArray(complexMock.mockValue.users)).toBe(true);
            expect(typeof complexMock.mockValue.metadata).toBe("object");
        });

        it("should handle primitive values in mockValue properties", () => {
            const primitiveMock: MockDataObject = {
                mockName: "PrimitiveMock",
                mockValue: {
                    stringField: "test string",
                    numberField: 42,
                    booleanField: true,
                    nullField: null,
                    undefinedField: undefined,
                },
            };

            expect(primitiveMock.mockValue.stringField).toBe("test string");
            expect(primitiveMock.mockValue.numberField).toBe(42);
            expect(primitiveMock.mockValue.booleanField).toBe(true);
            expect(primitiveMock.mockValue.nullField).toBeNull();
            expect(primitiveMock.mockValue.undefinedField).toBeUndefined();
        });
    });

    describe("MockDataVariants", () => {
        it("should properly type MockDataVariants as array of MockDataObject", () => {
            const variants: MockDataVariants = [
                {
                    mockName: "SearchResultAsUser",
                    mockValue: {
                        __typename: "User",
                        id: "1",
                        name: "John Doe",
                    },
                },
                {
                    mockName: "SearchResultAsPost",
                    mockValue: {
                        __typename: "Post",
                        id: "1",
                        title: "Hello World",
                    },
                },
            ];

            expect(variants).toHaveLength(2);
            expect(variants[0].mockName).toBe("SearchResultAsUser");
            expect(variants[1].mockName).toBe("SearchResultAsPost");
            expect(variants[0].mockValue.__typename).toBe("User");
            expect(variants[1].mockValue.__typename).toBe("Post");
        });

        it("should handle empty variants array", () => {
            const emptyVariants: MockDataVariants = [];
            expect(emptyVariants).toHaveLength(0);
        });
    });

    describe("CodeArtifactCollection", () => {
        it("should properly type CodeArtifactCollection as array of GeneratedCodeArtifact", () => {
            const collection: CodeArtifactCollection = [
                {
                    operationName: "GetUsers",
                    operationType: "query",
                    generatedCode: "export const aGetUsers = ...",
                },
                {
                    operationName: "AddUser",
                    operationType: "mutation",
                    generatedCode: "export const aAddUser = ...",
                },
            ];

            expect(collection).toHaveLength(2);
            expect(collection[0].operationType).toBe("query");
            expect(collection[1].operationType).toBe("mutation");
        });

        it("should handle empty collection", () => {
            const emptyCollection: CodeArtifactCollection = [];
            expect(emptyCollection).toHaveLength(0);
        });
    });

    describe("Type compatibility and safety", () => {
        it("should demonstrate type safety with Record<string, unknown>", () => {
            const mockData: MockDataObject = {
                mockName: "TypeSafetyTest",
                mockValue: {
                    anyField: "this can be any type",
                    nested: {
                        deeper: {
                            value: 123,
                        },
                    },
                    array: [1, 2, 3, "mixed", { types: true }],
                },
            };

            // The type system ensures mockName is a string and mockValue is Record<string, unknown>
            expect(typeof mockData.mockName).toBe("string");
            expect(mockData.mockValue).toBeDefined();
            expect(typeof mockData.mockValue).toBe("object");
            expect(mockData.mockValue.anyField).toBe("this can be any type");
        });

        it("should work with deeply nested structures", () => {
            const deepMock: MockDataObject = {
                mockName: "DeepNesting",
                mockValue: {
                    level1: {
                        level2: {
                            level3: {
                                level4: {
                                    deepValue: "found it!",
                                },
                            },
                        },
                    },
                },
            };

            expect(
                (deepMock.mockValue.level1 as any).level2.level3.level4
                    .deepValue,
            ).toBe("found it!");
        });
    });
});
