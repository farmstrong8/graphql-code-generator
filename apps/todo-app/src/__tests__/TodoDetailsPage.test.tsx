import { screen, waitFor } from "@testing-library/react";
import { TodoDetailPage } from "../pages/TodoDetailsPage";
import { renderWithProviders } from "../test/utils";
import { TodoDetailsPageDocument } from "../pages/graphql/generated/TodoDetailsPageQuery";
import { aTodoDetailsPageAsTodo, aTodoDetailsPageAsError } from "../pages/graphql/mocks/TodoDetailsPageQuery.mock";

// Custom render function for TodoDetailsPage that includes route params
function renderTodoDetailsPage(todoId: string, mocks: any[] = []) {
    return renderWithProviders(<TodoDetailPage />, {
        mocks,
        initialEntries: [`/todos/${todoId}`],
    });
}

describe("TodoDetailsPage", () => {
    const mockTodoId = "a7133b43-2415-4046-8036-398886429e5d"; // Use the default ID from generated mocks

    describe("Loading and Error States", () => {
        it("displays loading state initially", () => {
            const mockLoading = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                delay: 100, // Keep in loading state
            };

            renderTodoDetailsPage(mockTodoId, [mockLoading]);

            // Debug: let's see what's actually rendered
            screen.debug();
            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });

        it("displays error state when query fails", async () => {
            const mockError = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                result: {
                    data: aTodoDetailsPageAsError(),
                },
            };

            renderTodoDetailsPage(mockTodoId, [mockError]);

            await waitFor(() => {
                expect(screen.getByText("Nam sed quis sunt quis.")).toBeInTheDocument();
            });
        });

        it("handles network errors gracefully", async () => {
            const mockNetworkError = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                error: new Error("Network error"),
            };

            renderTodoDetailsPage(mockTodoId, [mockNetworkError]);

            await waitFor(() => {
                expect(screen.getByText("Todo not found")).toBeInTheDocument();
            });
        });
    });

    describe("Todo Display", () => {
        it("displays todo details when query succeeds", async () => {
            const mockTodo = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                result: {
                    data: aTodoDetailsPageAsTodo(),
                },
            };

            renderTodoDetailsPage(mockTodoId, [mockTodo]);

            // Debug what's actually rendered
            screen.debug();
            
            await waitFor(() => {
                expect(screen.getByText("Ad vel voluptas vitae inventore.")).toBeInTheDocument();
                expect(screen.getByText("Status: 🕒 In Progress")).toBeInTheDocument(); // Default is false (incomplete)
            });
        });

        it("displays toggle button for todo", async () => {
            const mockTodo = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                result: {
                    data: aTodoDetailsPageAsTodo(),
                },
            };

            renderTodoDetailsPage(mockTodoId, [mockTodo]);

            await waitFor(() => {
                const toggleButton = screen.getByRole("button", { name: "Toggle Complete" });
                expect(toggleButton).toBeInTheDocument();
            });
        });
    });

    describe("UI Elements and Styling", () => {
        it("displays the correct page layout", async () => {
            const mockTodo = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                result: {
                    data: aTodoDetailsPageAsTodo(),
                },
            };

            renderTodoDetailsPage(mockTodoId, [mockTodo]);

            await waitFor(() => {
                const container = screen.getByText("Ad vel voluptas vitae inventore.").closest("div");
                expect(container).toHaveClass("p-4");
            });
        });

        it("has back to todos link", async () => {
            const mockTodo = {
                request: {
                    query: TodoDetailsPageDocument,
                    variables: { todoId: mockTodoId },
                },
                result: {
                    data: aTodoDetailsPageAsTodo(),
                },
            };

            renderTodoDetailsPage(mockTodoId, [mockTodo]);

            await waitFor(() => {
                const backLink = screen.getByRole("link", { name: "← Back to Todos" });
                expect(backLink).toBeInTheDocument();
                expect(backLink).toHaveAttribute("href", "/");
            });
        });
    });

    describe("Mock Data Validation", () => {
        it("validates generated mock structure", () => {
            const mockData = aTodoDetailsPageAsTodo();
            
            expect(mockData).toHaveProperty("__typename", "Query");
            expect(mockData.todo).toHaveProperty("__typename", "Todo");
            expect(mockData.todo).toHaveProperty("id");
            expect(mockData.todo).toHaveProperty("title");
            expect(mockData.todo).toHaveProperty("completed");
        });

        it("validates error mock structure", () => {
            const errorData = aTodoDetailsPageAsError();
            
            expect(errorData).toHaveProperty("__typename", "Query");
            expect(errorData.todo).toHaveProperty("__typename", "Error");
            expect(errorData.todo).toHaveProperty("message");
        });
    });
});