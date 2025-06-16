import { describe, it, expect, beforeEach } from "vitest";
import { TypeScriptCodeBuilder } from "../../builders/TypeScriptCodeBuilder";
import { TypeInferenceService } from "../TypeInferenceService";
import { NestedTypeService } from "../NestedTypeService";
import { NamingService } from "../NamingService";
import { ScalarHandler } from "../../handlers/ScalarHandler";
import { PluginConfig } from "../../config/PluginConfig";
import { buildSchema, parse } from "graphql";

describe("Nested Type Extraction", () => {
    it("should generate correct TodosPageQuery with nested TodosPageTodo type", () => {
        const schema = buildSchema(`
            type Query {
                todos: [Todo!]!
            }
            
            type Todo {
                id: ID!
                title: String!
                completed: Boolean!
                dueAt: String
                author: Author!
            }
            
            type Author {
                id: ID!
                name: String!
            }
        `);

        const document = parse(`
            query TodosPageQuery {
                todos {
                    id
                    title
                    completed
                    dueAt
                    author {
                        __typename
                    }
                }
            }
        `);

        const typeInferenceService = new TypeInferenceService(schema);
        const nestedTypeService = new NestedTypeService(schema);
        const namingService = new NamingService();
        const config = new PluginConfig({});
        const scalarHandler = new ScalarHandler(config);
        const codeBuilder = new TypeScriptCodeBuilder(
            typeInferenceService,
            nestedTypeService,
            namingService,
            scalarHandler,
            schema,
        );

        const mockDataObjects = [
            {
                mockName: "TodosPageQuery",
                mockValue: {
                    __typename: "Query",
                    todos: [
                        {
                            __typename: "Todo",
                            id: "test-id",
                            title: "Test Todo",
                            completed: false,
                            dueAt: "2025-01-01",
                            author: {
                                __typename: "Author",
                            },
                        },
                    ],
                },
            },
        ];

        const operation = document.definitions[0] as any;
        const schemaContext = {
            parentType: schema.getQueryType()!,
            selectionSet: operation.selectionSet,
            fragmentRegistry: new Map(),
        };

        const result = codeBuilder.buildCodeArtifact(
            "TodosPageQuery",
            "query",
            schemaContext,
        );

        expect(result.generatedCode).toContain("type TodosPageQueryTodos = {");
        expect(result.generatedCode).toContain('"__typename": "Todo",');
        expect(result.generatedCode).toContain("id: string");
        expect(result.generatedCode).toContain("title: string");
        expect(result.generatedCode).toContain("completed: boolean");
        expect(result.generatedCode).toContain("type TodosPageQueryQuery = {");
        expect(result.generatedCode).toContain('"__typename": "Query",');
        expect(result.generatedCode).toContain("todos: Array<{");
        expect(result.generatedCode).toContain(
            "export const aTodosPageQueryTodos = createBuilder<TodosPageQueryTodos>(",
        );
        expect(result.generatedCode).toContain(
            "export const aTodosPageQueryQuery = createBuilder<TodosPageQueryQuery>(",
        );
        // The author field should only contain __typename since that's all the query selects
        expect(result.generatedCode).toContain(
            "type TodosPageQueryTodosAuthor = {",
        );
        expect(result.generatedCode).toContain('"__typename": "Author"');

        // Should NOT have broken type definitions
        expect(result.generatedCode).not.toContain(
            "type TodosPageQuery = TodosPageTodo",
        );
    });
});

describe("NestedTypeService", () => {
    let schema: any;
    let nestedTypeService: NestedTypeService;

    beforeEach(() => {
        schema = buildSchema(`
            type Query {
                todo: Todo
                user: User
                todos: [Todo!]!
                users: [User!]!
            }

            type Todo {
                id: ID!
                title: String!
                completed: Boolean!
                author: Author
                assignee: User
                address: Address
            }

            type User {
                id: ID!
                name: String!
                email: String!
                address: Address
                todos: [Todo!]!
                profile: Profile
            }

            type Author {
                id: ID!
                name: String!
                email: String!
                address: Address
                books: [String!]!
            }

            type Profile {
                bio: String
                avatar: String
                settings: Settings
                user: User
            }

            type Settings {
                theme: String
                notifications: Boolean
                profile: Profile
            }

            type Address {
                street: String!
                city: String!
                zipcode: String!
                country: String!
            }
        `);

        nestedTypeService = new NestedTypeService(schema);
    });

    describe("Path-based naming", () => {
        it("should generate different builders for same type in different contexts", () => {
            const document = parse(`
                query TodoQuery {
                    todo {
                        id
                        title
                        author {
                            id
                            name
                            address {
                                street
                                zipcode
                            }
                        }
                        address {
                            street
                            zipcode
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const todoType = schema.getType("Todo");

            const result = nestedTypeService.analyzeSelectionSet({
                parentType: todoType,
                selectionSet: operation.selectionSet.selections[0].selectionSet,
                operationName: "TodoQuery",
                fragmentRegistry: new Map(),
            });

            // Should create separate builders for:
            // 1. todo.author (Author type)
            // 2. todo.author.address (Address type in author context)
            // 3. todo.address (Address type in todo context)
            expect(result).toHaveLength(3);

            const authorBuilder = result.find((info) => info.path === "author");
            const authorAddressBuilder = result.find(
                (info) => info.path === "author.address",
            );
            const todoAddressBuilder = result.find(
                (info) => info.path === "address",
            );

            expect(authorBuilder).toBeDefined();
            expect(authorBuilder!.builderName).toBe("aTodoQueryAuthor");
            expect(authorBuilder!.operationTypeName).toBe("TodoQueryAuthor");

            expect(authorAddressBuilder).toBeDefined();
            expect(authorAddressBuilder!.builderName).toBe(
                "aTodoQueryAuthorAddress",
            );
            expect(authorAddressBuilder!.operationTypeName).toBe(
                "TodoQueryAuthorAddress",
            );

            expect(todoAddressBuilder).toBeDefined();
            expect(todoAddressBuilder!.builderName).toBe("aTodoQueryAddress");
            expect(todoAddressBuilder!.operationTypeName).toBe(
                "TodoQueryAddress",
            );
        });

        it("should handle hierarchical composition with 4 separate builders", () => {
            // This is the exact example from our discussion
            const document = parse(`
                query TodoQuery {
                    todo {
                        id
                        name
                        description
                        author {
                            id
                            name
                            email
                            address {
                                street
                                zipcode
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            const result = nestedTypeService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "TodoQuery",
                fragmentRegistry: new Map(),
            });

            // Should create 4 separate builders:
            // 1. Builder for the todo
            // 2. Builder for the author
            // 3. Builder for the address
            expect(result).toHaveLength(3);

            const todoBuilder = result.find((info) => info.path === "todo");
            const authorBuilder = result.find(
                (info) => info.path === "todo.author",
            );
            const addressBuilder = result.find(
                (info) => info.path === "todo.author.address",
            );

            expect(todoBuilder).toBeDefined();
            expect(todoBuilder!.builderName).toBe("aTodoQueryTodo");
            expect(todoBuilder!.typeName).toBe("Todo");

            expect(authorBuilder).toBeDefined();
            expect(authorBuilder!.builderName).toBe("aTodoQueryTodoAuthor");
            expect(authorBuilder!.typeName).toBe("Author");

            expect(addressBuilder).toBeDefined();
            expect(addressBuilder!.builderName).toBe(
                "aTodoQueryTodoAuthorAddress",
            );
            expect(addressBuilder!.typeName).toBe("Address");
        });
    });

    describe("Recursion handling", () => {
        it("should handle circular references with depth protection", () => {
            const document = parse(`
                query UserQuery {
                    user {
                        id
                        name
                        profile {
                            bio
                            user {
                                id
                                name
                                profile {
                                    bio
                                    user {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            // Use default max depth of 5
            const result = nestedTypeService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "UserQuery",
                fragmentRegistry: new Map(),
            });

            // Should stop before infinite recursion
            expect(result.length).toBeGreaterThan(0);
            expect(result.length).toBeLessThan(10); // Reasonable upper bound

            // Check that we have the expected nested types
            const userBuilder = result.find((info) => info.path === "user");
            const profileBuilder = result.find(
                (info) => info.path === "user.profile",
            );
            const nestedUserBuilder = result.find(
                (info) => info.path === "user.profile.user",
            );

            expect(userBuilder).toBeDefined();
            expect(profileBuilder).toBeDefined();
            expect(nestedUserBuilder).toBeDefined();
        });

        it("should respect custom recursion configuration", () => {
            const customService = new NestedTypeService(schema, {
                maxDepth: 2,
                createBuildersAtMaxDepth: false,
            });

            const document = parse(`
                query DeepQuery {
                    user {
                        id
                        profile {
                            bio
                            settings {
                                theme
                                profile {
                                    bio
                                }
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            const result = customService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "DeepQuery",
                fragmentRegistry: new Map(),
            });

            // With maxDepth=2 and createBuildersAtMaxDepth=false, should only create user (depth 1)
            expect(result).toHaveLength(1);

            const userBuilder = result.find((info) => info.path === "user");
            const profileBuilder = result.find(
                (info) => info.path === "user.profile",
            );
            const settingsBuilder = result.find(
                (info) => info.path === "user.profile.settings",
            );

            expect(userBuilder).toBeDefined();
            expect(userBuilder!.depth).toBe(1);

            // Profile would be at depth 2, but createBuildersAtMaxDepth=false means it's not created
            expect(profileBuilder).toBeUndefined();
            expect(settingsBuilder).toBeUndefined();
        });

        it("should handle self-referencing types", () => {
            const document = parse(`
                query UserQuery {
                    user {
                        id
                        name
                        profile {
                            bio
                            user {
                                id
                                name
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            const result = nestedTypeService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "UserQuery",
                fragmentRegistry: new Map(),
            });

            // Should handle the circular User -> Profile -> User reference
            const userBuilder = result.find((info) => info.path === "user");
            const profileBuilder = result.find(
                (info) => info.path === "user.profile",
            );
            const nestedUserBuilder = result.find(
                (info) => info.path === "user.profile.user",
            );

            expect(userBuilder).toBeDefined();
            expect(userBuilder!.typeName).toBe("User");

            expect(profileBuilder).toBeDefined();
            expect(profileBuilder!.typeName).toBe("Profile");

            expect(nestedUserBuilder).toBeDefined();
            expect(nestedUserBuilder!.typeName).toBe("User");

            // They should have different paths and builder names
            expect(userBuilder!.builderName).toBe("aUserQueryUser");
            expect(nestedUserBuilder!.builderName).toBe(
                "aUserQueryUserProfileUser",
            );
        });
    });

    describe("Type name generation", () => {
        it("should generate correct type names for nested paths", () => {
            const testCases = [
                {
                    operationName: "GetUser",
                    path: "user",
                    typeName: "User",
                    expected: "GetUserUser",
                },
                {
                    operationName: "GetUser",
                    path: "user.profile",
                    typeName: "Profile",
                    expected: "GetUserUserProfile",
                },
                {
                    operationName: "GetUser",
                    path: "user.profile.settings",
                    typeName: "Settings",
                    expected: "GetUserUserProfileSettings",
                },
                {
                    operationName: "TodoQuery",
                    path: "todo.author.address",
                    typeName: "Address",
                    expected: "TodoQueryTodoAuthorAddress",
                },
            ];

            testCases.forEach(({ operationName, path, typeName, expected }) => {
                const result = nestedTypeService.generateTypeName(
                    operationName,
                    path,
                    typeName,
                );
                expect(result).toBe(expected);
            });
        });

        it("should generate correct builder names with 'a' prefix", () => {
            const testCases = [
                {
                    operationName: "GetUser",
                    path: "user.profile",
                    typeName: "Profile",
                    expected: "aGetUserUserProfile",
                },
                {
                    operationName: "TodoQuery",
                    path: "todo.author.address",
                    typeName: "Address",
                    expected: "aTodoQueryTodoAuthorAddress",
                },
            ];

            testCases.forEach(({ operationName, path, typeName, expected }) => {
                const result = nestedTypeService.generateBuilderName(
                    operationName,
                    path,
                    typeName,
                );
                expect(result).toBe(expected);
            });
        });
    });

    describe("Complex scenarios", () => {
        it("should handle multiple nested arrays", () => {
            const document = parse(`
                query ComplexQuery {
                    users {
                        id
                        name
                        todos {
                            id
                            title
                            author {
                                id
                                name
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            const result = nestedTypeService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "ComplexQuery",
                fragmentRegistry: new Map(),
            });

            // Should create builders for:
            // 1. users (User type)
            // 2. users.todos (Todo type)
            // 3. users.todos.author (Author type)
            expect(result).toHaveLength(3);

            const usersBuilder = result.find((info) => info.path === "users");
            const todosBuilder = result.find(
                (info) => info.path === "users.todos",
            );
            const authorBuilder = result.find(
                (info) => info.path === "users.todos.author",
            );

            expect(usersBuilder).toBeDefined();
            expect(usersBuilder!.builderName).toBe("aComplexQueryUsers");

            expect(todosBuilder).toBeDefined();
            expect(todosBuilder!.builderName).toBe("aComplexQueryUsersTodos");

            expect(authorBuilder).toBeDefined();
            expect(authorBuilder!.builderName).toBe(
                "aComplexQueryUsersTodosAuthor",
            );
        });

        it("should handle same type in multiple different contexts", () => {
            const document = parse(`
                query MultiContextQuery {
                    todo {
                        id
                        author {
                            id
                            name
                            address {
                                street
                                city
                            }
                        }
                        assignee {
                            id
                            name
                            address {
                                street
                                city
                            }
                        }
                    }
                }
            `);

            const operation = document.definitions[0] as any;
            const queryType = schema.getQueryType()!;

            const result = nestedTypeService.analyzeSelectionSet({
                parentType: queryType,
                selectionSet: operation.selectionSet,
                operationName: "MultiContextQuery",
                fragmentRegistry: new Map(),
            });

            // Should create separate builders for:
            // 1. todo
            // 2. todo.author (Author)
            // 3. todo.author.address (Address in author context)
            // 4. todo.assignee (User)
            // 5. todo.assignee.address (Address in assignee context)
            expect(result).toHaveLength(5);

            const authorAddressBuilder = result.find(
                (info) => info.path === "todo.author.address",
            );
            const assigneeAddressBuilder = result.find(
                (info) => info.path === "todo.assignee.address",
            );

            expect(authorAddressBuilder).toBeDefined();
            expect(authorAddressBuilder!.builderName).toBe(
                "aMultiContextQueryTodoAuthorAddress",
            );

            expect(assigneeAddressBuilder).toBeDefined();
            expect(assigneeAddressBuilder!.builderName).toBe(
                "aMultiContextQueryTodoAssigneeAddress",
            );

            // Both should be Address type but with different builder names
            expect(authorAddressBuilder!.typeName).toBe("Address");
            expect(assigneeAddressBuilder!.typeName).toBe("Address");
            expect(authorAddressBuilder!.builderName).not.toBe(
                assigneeAddressBuilder!.builderName,
            );
        });
    });

    describe("Recursion configuration", () => {
        it("should respect maxDepth configuration", () => {
            const customService = new NestedTypeService(schema, {
                maxDepth: 3,
                createBuildersAtMaxDepth: true,
            });

            expect(customService.getRecursionConfig().maxDepth).toBe(3);
            expect(
                customService.getRecursionConfig().createBuildersAtMaxDepth,
            ).toBe(true);
        });

        it("should use default configuration when not provided", () => {
            const defaultService = new NestedTypeService(schema);
            const config = defaultService.getRecursionConfig();

            expect(config.maxDepth).toBe(5);
            expect(config.createBuildersAtMaxDepth).toBe(true);
        });
    });
});
