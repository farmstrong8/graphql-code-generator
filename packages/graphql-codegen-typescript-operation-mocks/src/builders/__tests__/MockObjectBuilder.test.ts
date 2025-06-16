import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSchema, parse, Kind } from "graphql";
import { MockObjectBuilder } from "../MockObjectBuilder";
import { ScalarHandler } from "../../handlers/ScalarHandler";
import { SelectionSetHandler } from "../../handlers/SelectionSetHandler";
import { UnionMockService } from "../../services/UnionMockService";
import { FieldMockService } from "../../services/FieldMockService";
import { PluginConfig } from "../../config/PluginConfig";
import { SelectionSetNode } from "graphql";

describe("MockObjectBuilder", () => {
    let schema: any;
    let scalarHandler: ScalarHandler;
    let selectionSetHandler: SelectionSetHandler;
    let unionMockService: UnionMockService;
    let fieldMockService: FieldMockService;
    let builder: MockObjectBuilder;

    beforeEach(() => {
        schema = buildSchema(`
            type Query {
                hello: String
                user(id: ID!): User
                users: [User!]!
                search: SearchResult
                todo(id: ID!): TodoResult
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
                settings: Settings
            }

            type Settings {
                theme: String
                notifications: Boolean
            }

            type Post {
                id: ID!
                title: String!
                content: String!
                author: User!
            }

            type Author {
                id: ID!
                name: String!
                books: [String!]!
            }

            type Todo {
                id: ID!
                title: String!
                completed: Boolean!
            }

            type Error {
                message: String!
            }

            union SearchResult = User | Author
            union TodoResult = Todo | Error

            scalar Date
        `);

        const config = new PluginConfig({
            scalars: {
                Date: "date",
            },
        });

        scalarHandler = new ScalarHandler(config);
        selectionSetHandler = new SelectionSetHandler(schema);
        unionMockService = new UnionMockService(schema);
        fieldMockService = new FieldMockService(scalarHandler);
        builder = new MockObjectBuilder(
            schema,
            scalarHandler,
            selectionSetHandler,
            unionMockService,
            fieldMockService,
        );
    });

    describe("buildForType - Simple Objects", () => {
        it("should build mock for simple object type using parsed GraphQL", () => {
            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        id
                        name
                        email
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            const result = builder.buildForType(
                userType,
                userField.selectionSet,
                "TestUser",
                new Map(),
            );

            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("TestUser");
            expect(result[0].mockValue.__typename).toBe("User");
            expect(result[0].mockValue).toHaveProperty("id");
            expect(result[0].mockValue).toHaveProperty("name");
            expect(result[0].mockValue).toHaveProperty("email");
        });

        it("should handle nested object fields", () => {
            const document = parse(`
                query GetUserWithProfile {
                    user(id: "1") {
                        id
                        name
                        profile {
                            bio
                            avatar
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            const result = builder.buildForType(
                userType,
                userField.selectionSet,
                "UserWithProfile",
                new Map(),
            );

            expect(result).toHaveLength(1);
            const mockValue = result[0].mockValue as any;
            expect(mockValue.profile).toBeDefined();
            expect(mockValue.profile.__typename).toBe("Profile");
            expect(mockValue.profile).toHaveProperty("bio");
            expect(mockValue.profile).toHaveProperty("avatar");
        });

        it("should handle deeply nested objects", () => {
            const document = parse(`
                query GetUserWithSettings {
                    user(id: "1") {
                        id
                        profile {
                            bio
                            settings {
                                theme
                                notifications
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            const result = builder.buildForType(
                userType,
                userField.selectionSet,
                "UserWithDeepNesting",
                new Map(),
            );

            expect(result).toHaveLength(1);
            const mockValue = result[0].mockValue as any;
            expect(mockValue.profile.settings).toBeDefined();
            expect(mockValue.profile.settings.__typename).toBe("Settings");
            expect(mockValue.profile.settings).toHaveProperty("theme");
            expect(mockValue.profile.settings).toHaveProperty("notifications");
        });

        it("should handle array fields", () => {
            const document = parse(`
                query GetUserWithPosts {
                    user(id: "1") {
                        id
                        posts {
                            id
                            title
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            const result = builder.buildForType(
                userType,
                userField.selectionSet,
                "UserWithPosts",
                new Map(),
            );

            expect(result).toHaveLength(1);
            const mockValue = result[0].mockValue as any;
            expect(mockValue.posts).toBeInstanceOf(Array);
            expect(mockValue.posts).toHaveLength(1);
            expect(mockValue.posts[0].__typename).toBe("Post");
            expect(mockValue.posts[0]).toHaveProperty("id");
            expect(mockValue.posts[0]).toHaveProperty("title");
        });
    });

    describe("buildForType - Union Types", () => {
        it("should build mock variants for union type with inline fragments", () => {
            const document = parse(`
                query SearchQuery {
                    search {
                        ... on User {
                            id
                            name
                            email
                        }
                        ... on Author {
                            id
                            name
                            books
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                searchField.selectionSet,
                "SearchQuery",
                new Map(),
            );

            expect(result).toHaveLength(2);

            const userVariant = result.find(
                (v) => v.mockName === "SearchQueryAsUser",
            );
            const authorVariant = result.find(
                (v) => v.mockName === "SearchQueryAsAuthor",
            );

            expect(userVariant).toBeDefined();
            expect(userVariant!.mockValue.__typename).toBe("User");
            expect(userVariant!.mockValue).toHaveProperty("id");
            expect(userVariant!.mockValue).toHaveProperty("name");
            expect(userVariant!.mockValue).toHaveProperty("email");

            expect(authorVariant).toBeDefined();
            expect(authorVariant!.mockValue.__typename).toBe("Author");
            expect(authorVariant!.mockValue).toHaveProperty("id");
            expect(authorVariant!.mockValue).toHaveProperty("name");
            expect(authorVariant!.mockValue).toHaveProperty("books");
        });

        it("should handle union type with single inline fragment", () => {
            const document = parse(`
                query TodoQuery {
                    todo(id: "1") {
                        ... on Todo {
                            id
                            title
                            completed
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const todoField = operation.selectionSet.selections[0];
            const todoResultType = schema.getType("TodoResult");

            const result = builder.buildForType(
                todoResultType,
                todoField.selectionSet,
                "TodoQuery",
                new Map(),
            );

            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("TodoQueryAsTodo");
            expect(result[0].mockValue.__typename).toBe("Todo");
            expect(result[0].mockValue).toHaveProperty("id");
            expect(result[0].mockValue).toHaveProperty("title");
            expect(result[0].mockValue).toHaveProperty("completed");
        });

        it("should handle empty union selection sets", () => {
            const searchResultType = schema.getType("SearchResult");
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [],
            };

            const result = builder.buildForType(
                searchResultType,
                selectionSet,
                "EmptyUnionQuery",
                new Map(),
            );

            expect(result).toHaveLength(0);
        });

        it("should ignore non-inline fragment selections in union types", () => {
            const document = parse(`
                query SearchQuery {
                    search {
                        id
                        ... on User {
                            name
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                searchField.selectionSet,
                "SearchQuery",
                new Map(),
            );

            // Should only process the inline fragment, ignoring the 'id' field
            expect(result).toHaveLength(1);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
        });

        it("should handle multiple inline fragments of the same type", () => {
            const document = parse(`
                query SearchQuery {
                    search {
                        ... on User {
                            id
                            name
                        }
                        ... on User {
                            id
                            email
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                searchField.selectionSet,
                "SearchQuery",
                new Map(),
            );

            // Should create two variants even though they're both User types
            expect(result).toHaveLength(2);
            expect(result[0].mockName).toBe("SearchQueryAsUser");
            expect(result[1].mockName).toBe("SearchQueryAsUser");
        });

        it("should handle inline fragment with missing type condition", () => {
            const selectionSet: SelectionSetNode = {
                kind: Kind.SELECTION_SET,
                selections: [
                    {
                        kind: Kind.INLINE_FRAGMENT,
                        selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [],
                        },
                        // Missing typeCondition
                    } as any,
                ],
            };

            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                selectionSet,
                "TestQuery",
                new Map(),
            );

            expect(result).toHaveLength(0);
        });

        it("should handle inline fragment with non-existent type", () => {
            const document = parse(`
                query SearchQuery {
                    search {
                        ... on NonExistentType {
                            id
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                searchField.selectionSet,
                "SearchQuery",
                new Map(),
            );

            expect(result).toHaveLength(0);
        });

        it("should handle inline fragment with type not in union", () => {
            // Use the Todo type which is not part of SearchResult union
            const document = parse(`
                query SearchQuery {
                    search {
                        ... on Todo {
                            id
                            title
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const searchField = operation.selectionSet.selections[0];
            const searchResultType = schema.getType("SearchResult");

            const result = builder.buildForType(
                searchResultType,
                searchField.selectionSet,
                "SearchQuery",
                new Map(),
            );

            expect(result).toHaveLength(0);
        });
    });

    describe("buildForType - Fragment Handling", () => {
        it("should handle fragment spreads", () => {
            const document = parse(`
                fragment UserFields on User {
                    id
                    name
                }
                
                query GetUserWithFragment {
                    user(id: "1") {
                        ...UserFields
                        email
                    }
                }
            `);

            const userType = schema.getType("User");
            const fragment = document.definitions[0] as any;
            const operation = document.definitions[1] as any;
            const userField = operation.selectionSet.selections[0];

            const fragmentRegistry = new Map();
            fragmentRegistry.set("UserFields", fragment);

            const result = builder.buildForType(
                userType,
                userField.selectionSet,
                "UserWithFragment",
                fragmentRegistry,
            );

            expect(result).toHaveLength(1);
            expect(result[0].mockValue.__typename).toBe("User");
            // The fragment fields should be resolved by SelectionSetHandler
            expect(result[0].mockValue).toHaveProperty("email");
        });
    });

    describe("integration with handlers", () => {
        it("should use ScalarHandler for scalar field generation", () => {
            const spy = vi.spyOn(scalarHandler, "generateMockValue");

            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        id
                        name
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            builder.buildForType(
                userType,
                userField.selectionSet,
                "TestScalarIntegration",
                new Map(),
            );

            expect(spy).toHaveBeenCalledWith("ID", "TestScalarIntegration");
            expect(spy).toHaveBeenCalledWith("String", "TestScalarIntegration");

            spy.mockRestore();
        });

        it("should use SelectionSetHandler for fragment resolution", () => {
            const spy = vi.spyOn(selectionSetHandler, "resolveSelectionSet");

            const document = parse(`
                query GetUser {
                    user(id: "1") {
                        id
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const userField = operation.selectionSet.selections[0];
            const userType = schema.getType("User");

            builder.buildForType(
                userType,
                userField.selectionSet,
                "TestSelectionSetIntegration",
                new Map(),
            );

            expect(spy).toHaveBeenCalledWith(
                userField.selectionSet,
                expect.any(Map),
            );

            spy.mockRestore();
        });
    });

    describe("error handling", () => {
        it("should handle empty selection sets gracefully", () => {
            const document = parse(`
                query EmptyQuery {
                    hello
                }
            `);

            const operation = document.definitions[0] as any;
            const helloField = operation.selectionSet.selections[0];

            // Try to build for a complex type but with a simple field (no selection set)
            const userType = schema.getType("User");

            // This should handle the case where selectionSet is undefined
            const result = builder.buildForType(
                userType,
                { kind: Kind.SELECTION_SET, selections: [] },
                "EmptyTest",
                new Map(),
            );

            expect(result).toHaveLength(1);
            expect(result[0].mockValue.__typename).toBe("User");
        });
    });
});
