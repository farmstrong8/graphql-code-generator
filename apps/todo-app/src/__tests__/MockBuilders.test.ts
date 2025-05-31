import { describe, it, expect } from "vitest";
import { aTodosPage } from "../pages/graphql/mocks/TodosPageQuery.mock";
import { aAddTodo } from "../pages/graphql/mocks/AddTodoMutation.mock";
import { aDeleteTodo } from "../pages/graphql/mocks/DeleteTodoMutation.mock";
import { aToggleTodo } from "../pages/graphql/mocks/ToggleTodoMutation.mock";
import { aTodoDetailsPageAsTodo, aTodoDetailsPageAsError } from "../pages/graphql/mocks/TodoDetailsPageQuery.mock";
import { aAuthorFragmentFragment } from "../pages/graphql/mocks/AuthorFragment.mock";

describe("Generated Mock Builders", () => {
    describe("TodosPage Query Mock", () => {
        it("creates default mock data with correct structure", () => {
            const mockData = aTodosPage();
            
            expect(mockData).toHaveProperty("__typename", "Query");
            expect(mockData).toHaveProperty("todos");
            expect(mockData.todos).toHaveProperty("__typename", "Todo");
            expect(mockData.todos).toHaveProperty("id");
            expect(mockData.todos).toHaveProperty("title");
            expect(mockData.todos).toHaveProperty("completed");
            expect(mockData.todos).toHaveProperty("dueAt");
            expect(mockData.todos).toHaveProperty("author");
        });
    });

    describe("AddTodo Mutation Mock", () => {
        it("creates default mock data with correct structure", () => {
            const mockData = aAddTodo();
            
            expect(mockData).toHaveProperty("__typename", "Mutation");
            expect(mockData).toHaveProperty("addTodo");
            expect(mockData.addTodo).toHaveProperty("__typename", "Todo");
            expect(mockData.addTodo).toHaveProperty("id");
            expect(mockData.addTodo).toHaveProperty("title");
            expect(mockData.addTodo).toHaveProperty("completed");
        });
    });

    describe("DeleteTodo Mutation Mock", () => {
        it("creates default mock data with correct structure", () => {
            const mockData = aDeleteTodo();
            
            expect(mockData).toHaveProperty("__typename", "Mutation");
            expect(mockData).toHaveProperty("deleteTodo", false);
        });
    });

    describe("ToggleTodo Mutation Mock", () => {
        it("creates default mock data with correct structure", () => {
            const mockData = aToggleTodo();
            
            expect(mockData).toHaveProperty("__typename", "Mutation");
            expect(mockData).toHaveProperty("toggleTodo");
            expect(mockData.toggleTodo).toHaveProperty("__typename", "Todo");
            expect(mockData.toggleTodo).toHaveProperty("id");
            expect(mockData.toggleTodo).toHaveProperty("completed");
        });
    });

    describe("TodoDetailsPage Query Mock", () => {
        it("creates default Todo mock data with correct structure", () => {
            const mockData = aTodoDetailsPageAsTodo();
            
            expect(mockData).toHaveProperty("__typename", "Query");
            expect(mockData).toHaveProperty("todo");
            expect(mockData.todo).toHaveProperty("__typename", "Todo");
            expect(mockData.todo).toHaveProperty("id");
            expect(mockData.todo).toHaveProperty("title");
            expect(mockData.todo).toHaveProperty("completed");
        });

        it("creates default Error mock data with correct structure", () => {
            const mockData = aTodoDetailsPageAsError();
            
            expect(mockData).toHaveProperty("__typename", "Query");
            expect(mockData).toHaveProperty("todo");
            expect(mockData.todo).toHaveProperty("__typename", "Error");
            expect(mockData.todo).toHaveProperty("message");
        });
    });

    describe("AuthorFragment Mock", () => {
        it("creates default author data with correct structure", () => {
            const mockData = aAuthorFragmentFragment();
            
            expect(mockData).toHaveProperty("__typename", "Author");
            expect(mockData).toHaveProperty("id");
            expect(mockData).toHaveProperty("name");
        });
    });

    describe("Mock Consistency", () => {
        it("generates consistent mock data across calls", () => {
            const mock1 = aTodosPage();
            const mock2 = aTodosPage();
            
            // Should have the same structure and values for default mocks
            expect(mock1.__typename).toBe(mock2.__typename);
            expect(mock1.todos.__typename).toBe(mock2.todos.__typename);
            expect(mock1.todos.id).toBe(mock2.todos.id);
            expect(mock1.todos.title).toBe(mock2.todos.title);
            expect(mock1.todos.completed).toBe(mock2.todos.completed);
        });

        it("works with builder functions", () => {
            // Test that the builder functions are properly exported and callable
            expect(typeof aTodosPage).toBe("function");
            expect(typeof aAddTodo).toBe("function");
            expect(typeof aDeleteTodo).toBe("function");
            expect(typeof aToggleTodo).toBe("function");
            expect(typeof aTodoDetailsPageAsTodo).toBe("function");
            expect(typeof aTodoDetailsPageAsError).toBe("function");
            expect(typeof aAuthorFragmentFragment).toBe("function");
        });
    });
});
