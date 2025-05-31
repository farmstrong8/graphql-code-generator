import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildSchema } from "graphql";
import { TypeScriptCodeBuilder } from "../TypeScriptCodeBuilder";
import { TypeInferenceService } from "../../services/TypeInferenceService";
import { NestedTypeCollector } from "../../services/NestedTypeCollector";
import type { MockDataVariants, MockDataObject } from "../../types";

const schema = buildSchema(`
  type Query {
    user(id: ID!): User
  }
  
  type User {
    id: ID!
    name: String!
    email: String!
  }
  
  type Mutation {
    createUser(input: CreateUserInput!): User
  }
  
  input CreateUserInput {
    name: String!
    email: String!
  }
`);

describe("TypeScriptCodeBuilder", () => {
    let builder: TypeScriptCodeBuilder;
    let typeInferenceService: TypeInferenceService;
    let nestedTypeCollector: NestedTypeCollector;

    beforeEach(() => {
        typeInferenceService = new TypeInferenceService(schema);
        nestedTypeCollector = new NestedTypeCollector(schema);
        builder = new TypeScriptCodeBuilder(
            typeInferenceService,
            nestedTypeCollector,
        );
    });

    describe("buildCodeArtifact", () => {
        it("should build code artifact for query operation", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "GetUserQuery",
                    mockValue: {
                        user: {
                            id: "123",
                            name: "John Doe",
                            email: "john@example.com",
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "GetUser",
                "query",
                mockDataObjects,
            );

            expect(result.operationName).toBe("GetUser");
            expect(result.operationType).toBe("query");
            expect(result.generatedCode).toContain("type GetUserQuery");
            expect(result.generatedCode).toContain("john@example.com");
            expect(result.generatedCode).toContain("DeepPartial");
        });

        it("should build code artifact for mutation operation", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "CreateUserMutation",
                    mockValue: {
                        createUser: {
                            id: "456",
                            name: "Jane Smith",
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "CreateUser",
                "mutation",
                mockDataObjects,
            );

            expect(result.operationName).toBe("CreateUser");
            expect(result.operationType).toBe("mutation");
            expect(result.generatedCode).toContain("type CreateUserMutation");
            expect(result.generatedCode).toContain("Jane Smith");
        });

        it("should build code artifact for subscription operation", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "UserUpdatedSubscription",
                    mockValue: {
                        userUpdated: {
                            id: "789",
                            name: "Updated User",
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "UserUpdated",
                "subscription",
                mockDataObjects,
            );

            expect(result.operationName).toBe("UserUpdated");
            expect(result.operationType).toBe("subscription");
            expect(result.generatedCode).toContain(
                "type UserUpdatedSubscription",
            );
            expect(result.generatedCode).toContain("Updated User");
        });

        it("should build code artifact for fragment", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "UserFragment",
                    mockValue: {
                        id: "123",
                        name: "Fragment User",
                        email: "fragment@example.com",
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "User",
                "fragment",
                mockDataObjects,
            );

            expect(result.operationName).toBe("User");
            expect(result.operationType).toBe("fragment");
            expect(result.generatedCode).toContain("type User");
            expect(result.generatedCode).toContain("fragment@example.com");
        });

        it("should handle multiple mock data objects", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "GetUserQuery",
                    mockValue: { user: { id: "1", name: "User 1" } },
                },
                {
                    mockName: "GetUserQueryVariant",
                    mockValue: { user: { id: "2", name: "User 2" } },
                },
            ];

            const result = builder.buildCodeArtifact(
                "GetUser",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain("type GetUserQuery");
            expect(result.generatedCode).toContain("type GetUserQueryVariant");
            expect(result.generatedCode).toContain("User 1");
            expect(result.generatedCode).toContain("User 2");
        });

        it("should handle empty mock data objects array", () => {
            const mockDataObjects: MockDataVariants = [];

            const result = builder.buildCodeArtifact(
                "Empty",
                "query",
                mockDataObjects,
            );

            expect(result.operationName).toBe("Empty");
            expect(result.operationType).toBe("query");
            // Should still contain boilerplate
            expect(result.generatedCode).toContain("import { merge }");
        });

        it("should handle complex nested objects", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "ComplexQuery",
                    mockValue: {
                        user: {
                            id: "123",
                            profile: {
                                name: "Test User",
                                settings: {
                                    theme: "dark",
                                    notifications: true,
                                },
                            },
                            posts: [
                                { id: "1", title: "First Post" },
                                { id: "2", title: "Second Post" },
                            ],
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "Complex",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain("Test User");
            expect(result.generatedCode).toContain("dark");
            expect(result.generatedCode).toContain("First Post");
            expect(result.generatedCode).toContain("Second Post");
        });

        it("should handle special characters in strings", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "SpecialCharsQuery",
                    mockValue: {
                        description: 'Text with "quotes" and \\backslashes\\',
                        multiline: "Line 1\nLine 2",
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "SpecialChars",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain('\\"quotes\\"');
            expect(result.generatedCode).toContain("\\\\backslashes\\\\");
            expect(result.generatedCode).toContain("\\n");
        });

        it("should handle null and boolean values", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "MixedTypesQuery",
                    mockValue: {
                        nullValue: null,
                        booleanTrue: true,
                        booleanFalse: false,
                        numberValue: 42,
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "MixedTypes",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain("null");
            expect(result.generatedCode).toContain("true");
            expect(result.generatedCode).toContain("false");
            expect(result.generatedCode).toContain("42");
        });
    });

    describe("generateCode", () => {
        it("should generate code for a single mock data object", () => {
            const mockData: MockDataObject = {
                mockName: "UserMock",
                mockValue: {
                    id: "123",
                    name: "Test User",
                    isActive: true,
                },
            };

            const result = builder.generateCode(mockData);

            expect(result.operationName).toBe("UserMock");
            expect(result.operationType).toBe("fragment"); // default for names that don't start with operation types
            expect(result.generatedCode).toContain("type UserMock");
            expect(result.generatedCode).toContain("Test User");
            expect(result.generatedCode).toContain("true");
            expect(result.generatedCode).toContain("createBuilder");
        });

        it("should infer operation type from mock name", () => {
            const queryMock: MockDataObject = {
                mockName: "queryGetUser",
                mockValue: { user: { id: "1" } },
            };

            const mutationMock: MockDataObject = {
                mockName: "mutationCreateUser",
                mockValue: { createUser: { id: "1" } },
            };

            const subscriptionMock: MockDataObject = {
                mockName: "subscriptionUserUpdated",
                mockValue: { userUpdated: { id: "1" } },
            };

            const queryResult = builder.generateCode(queryMock);
            const mutationResult = builder.generateCode(mutationMock);
            const subscriptionResult = builder.generateCode(subscriptionMock);

            expect(queryResult.operationType).toBe("query");
            expect(mutationResult.operationType).toBe("mutation");
            expect(subscriptionResult.operationType).toBe("subscription");
        });

        it("should handle array values", () => {
            const mockData: MockDataObject = {
                mockName: "ArrayMock",
                mockValue: {
                    tags: ["tag1", "tag2"],
                    scores: [1, 2, 3],
                    mixedArray: ["string", 123, true],
                },
            };

            const result = builder.generateCode(mockData);

            expect(result.generatedCode).toContain("tag1");
            expect(result.generatedCode).toContain("tag2");
            expect(result.generatedCode).toContain("[1, 2, 3]");
        });

        it("should handle empty objects and arrays", () => {
            const mockData: MockDataObject = {
                mockName: "EmptyMock",
                mockValue: {
                    emptyObject: {},
                    emptyArray: [],
                },
            };

            const result = builder.generateCode(mockData);

            expect(result.generatedCode).toContain("{}");
            expect(result.generatedCode).toContain("[]");
        });
    });

    describe("edge cases", () => {
        it("should handle __typename fields properly", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "TypenameQuery",
                    mockValue: {
                        user: {
                            __typename: "User",
                            id: "123",
                            name: "Test",
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "Typename",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain("__typename");
            expect(result.generatedCode).toContain("User");
        });

        it("should handle numeric keys that need quotes", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "NumericKeysQuery",
                    mockValue: {
                        "123": "numeric key",
                        "valid-key": "hyphenated key",
                        "space key": "spaced key",
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "NumericKeys",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain('"123"');
            expect(result.generatedCode).toContain('"valid-key"');
            expect(result.generatedCode).toContain('"space key"');
        });

        it("should handle deeply nested structures", () => {
            const mockDataObjects: MockDataVariants = [
                {
                    mockName: "DeepNestingQuery",
                    mockValue: {
                        level1: {
                            level2: {
                                level3: {
                                    level4: {
                                        value: "deep value",
                                    },
                                },
                            },
                        },
                    },
                },
            ];

            const result = builder.buildCodeArtifact(
                "DeepNesting",
                "query",
                mockDataObjects,
            );

            expect(result.generatedCode).toContain("deep value");
            expect(result.generatedCode).toContain("level1");
            expect(result.generatedCode).toContain("level4");
        });
    });
});
