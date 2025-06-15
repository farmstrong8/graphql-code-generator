import { describe, it, expect, beforeEach } from "vitest";
import { NamingService } from "../NamingService";

describe("NamingService", () => {
    let namingService: NamingService;

    beforeEach(() => {
        // Default configuration with suffixes enabled
        namingService = new NamingService();
    });

    describe("generateBuilderName", () => {
        it("should generate builder names with operation suffixes", () => {
            expect(namingService.generateBuilderName("GetTodos", "query")).toBe(
                "aGetTodosQuery",
            );
            expect(
                namingService.generateBuilderName("AddTodo", "mutation"),
            ).toBe("aAddTodoMutation");
            expect(
                namingService.generateBuilderName("OnUpdate", "subscription"),
            ).toBe("aOnUpdateSubscription");
            expect(
                namingService.generateBuilderName("AuthorFields", "fragment"),
            ).toBe("aAuthorFieldsFragment");
        });

        it("should generate builder names without suffixes when disabled", () => {
            const service = new NamingService({ addOperationSuffix: false });

            expect(service.generateBuilderName("GetTodos", "query")).toBe(
                "aGetTodos",
            );
            expect(service.generateBuilderName("AddTodo", "mutation")).toBe(
                "aAddTodo",
            );
            expect(
                service.generateBuilderName("OnUpdate", "subscription"),
            ).toBe("aOnUpdate");
            expect(
                service.generateBuilderName("AuthorFields", "fragment"),
            ).toBe("aAuthorFields");
        });

        it("should handle fallback without operation type", () => {
            expect(namingService.generateBuilderName("SomeMock")).toBe(
                "aSomeMock",
            );
        });
    });

    describe("generateTypeName", () => {
        it("should generate type names with operation suffixes by default", () => {
            expect(namingService.generateTypeName("GetTodos", "query")).toBe(
                "GetTodosQuery",
            );
            expect(namingService.generateTypeName("AddTodo", "mutation")).toBe(
                "AddTodoMutation",
            );
            expect(
                namingService.generateTypeName("OnUpdate", "subscription"),
            ).toBe("OnUpdateSubscription");
            expect(
                namingService.generateTypeName("AuthorFields", "fragment"),
            ).toBe("AuthorFieldsFragment");
        });

        it("should generate type names without suffixes when disabled", () => {
            const service = new NamingService({ addOperationSuffix: false });

            expect(service.generateTypeName("GetTodos", "query")).toBe(
                "GetTodos",
            );
            expect(service.generateTypeName("AddTodo", "mutation")).toBe(
                "AddTodo",
            );
            expect(service.generateTypeName("OnUpdate", "subscription")).toBe(
                "OnUpdate",
            );
            expect(service.generateTypeName("AuthorFields", "fragment")).toBe(
                "AuthorFields",
            );
        });

        it("should handle names that already have suffixes", () => {
            // When suffixes are enabled, it should add them regardless
            expect(
                namingService.generateTypeName("GetTodosQuery", "query"),
            ).toBe("GetTodosQueryQuery");
            expect(
                namingService.generateTypeName("AuthorFragment", "fragment"),
            ).toBe("AuthorFragmentFragment");

            // When suffixes are disabled, it should use names as-is
            const service = new NamingService({ addOperationSuffix: false });
            expect(service.generateTypeName("GetTodosQuery", "query")).toBe(
                "GetTodosQuery",
            );
            expect(service.generateTypeName("AuthorFragment", "fragment")).toBe(
                "AuthorFragment",
            );
        });
    });

    describe("inferOperationType", () => {
        it("should infer query operations", () => {
            expect(namingService.inferOperationType("GetUser")).toBe("query");
            expect(namingService.inferOperationType("FetchTodos")).toBe(
                "query",
            );
            expect(namingService.inferOperationType("UserQuery")).toBe("query");
        });

        it("should infer mutation operations", () => {
            expect(namingService.inferOperationType("AddTodo")).toBe(
                "mutation",
            );
            expect(namingService.inferOperationType("UpdateUser")).toBe(
                "mutation",
            );
            expect(namingService.inferOperationType("DeletePost")).toBe(
                "mutation",
            );
            expect(namingService.inferOperationType("CreateAccount")).toBe(
                "mutation",
            );
            expect(namingService.inferOperationType("TodoMutation")).toBe(
                "mutation",
            );
        });

        it("should infer subscription operations", () => {
            expect(namingService.inferOperationType("OnMessageAdded")).toBe(
                "subscription",
            );
            expect(namingService.inferOperationType("SubscribeToUpdates")).toBe(
                "subscription",
            );
            expect(
                namingService.inferOperationType("MessageSubscription"),
            ).toBe("subscription");
        });

        it("should default to fragment for unknown patterns", () => {
            expect(namingService.inferOperationType("UserFields")).toBe(
                "fragment",
            );
            expect(namingService.inferOperationType("AuthorData")).toBe(
                "fragment",
            );
            expect(namingService.inferOperationType("SomeRandomName")).toBe(
                "fragment",
            );
        });
    });

    describe("generateVariantName", () => {
        it("should generate variant names for union types", () => {
            expect(
                namingService.generateVariantName("SearchQuery", "User"),
            ).toBe("SearchQueryAsUser");
            expect(
                namingService.generateVariantName("GetItem", "Product"),
            ).toBe("GetItemAsProduct");
        });
    });

    describe("validateName", () => {
        it("should validate builder names", () => {
            const valid = namingService.validateName("aGetUser", "builder");
            expect(valid.isValid).toBe(true);
            expect(valid.errors).toHaveLength(0);

            const invalid = namingService.validateName("GetUser", "builder");
            expect(invalid.isValid).toBe(false);
            expect(invalid.errors).toContain(
                "Builder names must start with 'a' prefix",
            );
        });

        it("should validate type names", () => {
            const valid = namingService.validateName("GetUserQuery", "type");
            expect(valid.isValid).toBe(true);
            expect(valid.errors).toHaveLength(0);

            const invalid = namingService.validateName("getUserQuery", "type");
            expect(invalid.isValid).toBe(false);
            expect(invalid.errors).toContain(
                "Type names must be in PascalCase",
            );
        });

        it("should validate operation names", () => {
            const valid = namingService.validateName("GetUser", "operation");
            expect(valid.isValid).toBe(true);
            expect(valid.errors).toHaveLength(0);

            const invalid = namingService.validateName("getUser", "operation");
            expect(invalid.isValid).toBe(false);
            expect(invalid.errors).toContain(
                "Operation names must be in PascalCase",
            );
        });

        it("should handle empty names", () => {
            const result = namingService.validateName("", "builder");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Name cannot be empty");
        });
    });

    describe("normalizeOperationName", () => {
        it("should normalize operation names when suffixes are enabled", () => {
            expect(namingService.normalizeOperationName("GetUserQuery")).toBe(
                "GetUser",
            );
            expect(
                namingService.normalizeOperationName("AddTodoMutation"),
            ).toBe("AddTodo");
            expect(
                namingService.normalizeOperationName("OnUpdateSubscription"),
            ).toBe("OnUpdate");
        });

        it("should not normalize when suffixes are disabled", () => {
            const service = new NamingService({ addOperationSuffix: false });

            expect(service.normalizeOperationName("GetUserQuery")).toBe(
                "GetUserQuery",
            );
            expect(service.normalizeOperationName("AddTodoMutation")).toBe(
                "AddTodoMutation",
            );
        });

        it("should ensure PascalCase", () => {
            expect(namingService.normalizeOperationName("get_user_query")).toBe(
                "GetUser",
            );
            expect(namingService.normalizeOperationName("add-todo")).toBe(
                "AddTodo",
            );
        });
    });

    describe("getConfig", () => {
        it("should return current configuration", () => {
            const config = namingService.getConfig();
            expect(config.addOperationSuffix).toBe(true);

            const customService = new NamingService({
                addOperationSuffix: false,
            });
            const customConfig = customService.getConfig();
            expect(customConfig.addOperationSuffix).toBe(false);
        });
    });
});
