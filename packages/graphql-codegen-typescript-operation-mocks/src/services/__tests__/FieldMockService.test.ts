import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSchema, parse } from "graphql";
import { FieldMockService } from "../FieldMockService";
import { ScalarHandler } from "../../handlers/ScalarHandler";
import { PluginConfig } from "../../config/PluginConfig";
import type { FieldNode } from "graphql";

describe("FieldMockService", () => {
    let schema: any;
    let scalarHandler: ScalarHandler;
    let fieldMockService: FieldMockService;

    beforeEach(() => {
        schema = buildSchema(`
            type Query {
                hello: String
                user(id: ID!): User
                users: [User!]!
                search: SearchResult
            }

            type User {
                id: ID!
                name: String!
                email: String
                profile: Profile
                posts: [Post!]!
            }

            type Profile {
                bio: String
                avatar: String
            }

            type Post {
                id: ID!
                title: String!
                content: String!
            }

            union SearchResult = User | Post

            scalar Date
        `);

        const config = new PluginConfig({
            scalars: {
                Date: "date",
            },
        });

        scalarHandler = new ScalarHandler(config);
        fieldMockService = new FieldMockService(scalarHandler);
    });

    describe("generateFieldValue", () => {
        it("should generate scalar field values", () => {
            const spy = vi.spyOn(scalarHandler, "generateMockValue");
            spy.mockReturnValue("mocked-string");

            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        name
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const nameField = userField.selectionSet.selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                nameField,
                "TestOperation",
                new Map(),
            );

            expect(spy).toHaveBeenCalledWith("String", undefined);
            expect(result).toBe("mocked-string");

            spy.mockRestore();
        });

        it("should handle list type fields", () => {
            const spy = vi.spyOn(scalarHandler, "generateMockValue");
            spy.mockReturnValue("post-title");

            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        posts {
                            title
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const postsField = userField.selectionSet
                .selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                postsField,
                "TestOperation",
                new Map(),
            );

            expect(result).toBeInstanceOf(Array);
            expect(result).toHaveLength(1);
            expect((result as any[])[0]).toEqual({
                __typename: "Post",
            });
        });

        it("should handle object field values with nested object builder", () => {
            const mockNestedBuilder = vi.fn();
            mockNestedBuilder.mockReturnValue([
                {
                    mockValue: {
                        __typename: "Profile",
                        bio: "Test bio",
                        avatar: "test.jpg",
                    },
                },
            ]);

            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        profile {
                            bio
                            avatar
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const profileField = userField.selectionSet
                .selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                profileField,
                "TestOperation",
                new Map(),
                {
                    nestedObjectBuilder: mockNestedBuilder,
                },
            );

            expect(mockNestedBuilder).toHaveBeenCalled();
            expect(result).toEqual({
                __typename: "Profile",
                bio: "Test bio",
                avatar: "test.jpg",
            });
        });

        it("should handle object fields without nested object builder", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        profile {
                            bio
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const profileField = userField.selectionSet
                .selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                profileField,
                "TestOperation",
                new Map(),
            );

            expect(result).toEqual({
                __typename: "Profile",
            });
        });

        it("should return undefined for non-existent fields", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        nonExistentField
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const nonExistentField = userField.selectionSet
                .selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                nonExistentField,
                "TestOperation",
                new Map(),
            );

            expect(result).toBeUndefined();
        });

        it("should handle fields without selection sets", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        id
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const idField = userField.selectionSet.selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.generateFieldValue(
                userType,
                idField,
                "TestOperation",
                new Map(),
            );

            expect(typeof result).toBe("string"); // Scalar mock value
        });
    });

    describe("isListTypeRecursive", () => {
        it("should identify list types correctly", () => {
            const userType = schema.getType("User");
            const postsField = userType.getFields().posts;

            const result = fieldMockService.isListTypeRecursive(
                postsField.type,
            );

            expect(result).toBe(true);
        });

        it("should identify non-list types correctly", () => {
            const userType = schema.getType("User");
            const nameField = userType.getFields().name;

            const result = fieldMockService.isListTypeRecursive(nameField.type);

            expect(result).toBe(false);
        });

        it("should handle NonNull wrapped list types", () => {
            const queryType = schema.getType("Query");
            const usersField = queryType.getFields().users; // [User!]!

            const result = fieldMockService.isListTypeRecursive(
                usersField.type,
            );

            expect(result).toBe(true);
        });
    });

    describe("analyzeField", () => {
        it("should analyze scalar fields correctly", () => {
            const userType = schema.getType("User");

            const result = fieldMockService.analyzeField(userType, "name");

            expect(result.exists).toBe(true);
            expect(result.isScalar).toBe(true);
            expect(result.isObject).toBe(false);
            expect(result.isUnion).toBe(false);
            expect(result.isList).toBe(false);
        });

        it("should analyze object fields correctly", () => {
            const userType = schema.getType("User");

            const result = fieldMockService.analyzeField(userType, "profile");

            expect(result.exists).toBe(true);
            expect(result.isScalar).toBe(false);
            expect(result.isObject).toBe(true);
            expect(result.isUnion).toBe(false);
            expect(result.isList).toBe(false);
        });

        it("should analyze list fields correctly", () => {
            const userType = schema.getType("User");

            const result = fieldMockService.analyzeField(userType, "posts");

            expect(result.exists).toBe(true);
            expect(result.isScalar).toBe(false);
            expect(result.isObject).toBe(true);
            expect(result.isUnion).toBe(false);
            expect(result.isList).toBe(true);
        });

        it("should analyze union fields correctly", () => {
            const queryType = schema.getType("Query");

            const result = fieldMockService.analyzeField(queryType, "search");

            expect(result.exists).toBe(true);
            expect(result.isScalar).toBe(false);
            expect(result.isObject).toBe(false);
            expect(result.isUnion).toBe(true);
            expect(result.isList).toBe(false);
        });

        it("should handle non-existent fields", () => {
            const userType = schema.getType("User");

            const result = fieldMockService.analyzeField(
                userType,
                "nonExistent",
            );

            expect(result.exists).toBe(false);
            expect(result.type).toBeNull();
            expect(result.namedType).toBeNull();
        });
    });

    describe("validateFieldSelection", () => {
        it("should validate existing field selections", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        name
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const nameField = userField.selectionSet.selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.validateFieldSelection(
                userType,
                nameField,
            );

            expect(result).toBe(true);
        });

        it("should invalidate non-existent field selections", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        nonExistent
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const nonExistentField = userField.selectionSet
                .selections[0] as FieldNode;
            const userType = schema.getType("User");

            const result = fieldMockService.validateFieldSelection(
                userType,
                nonExistentField,
            );

            expect(result).toBe(false);
        });
    });
});
