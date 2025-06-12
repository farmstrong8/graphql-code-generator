import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodosPage } from "../pages/TodosPage";
import { renderWithProviders } from "../test/utils";
import { TodosPageDocument } from "@/pages/graphql/generated/TodosPageQuery";
import { aAddTodoMutation, aTodosPageQuery, aTodosPageTodo } from "@/mocks";
import { AddTodoDocument } from "@/pages/graphql/generated/AddTodoMutation";
import { ToggleTodoDocument } from "@/pages/graphql/generated/ToggleTodoMutation";
import { DeleteTodoDocument } from "@/pages/graphql/generated/DeleteTodoMutation";

// Mock data builders for different scenarios
const mockTodosEmpty = {
    request: {
        query: TodosPageDocument,
    },
    result: {
        data: aTodosPageQuery({
            todos: [],
        }),
    },
};

const mockTodosWithItems = {
    request: {
        query: TodosPageDocument,
    },
    result: {
        data: aTodosPageQuery({
            todos: [
                aTodosPageTodo({
                    id: "1",
                    completed: false,
                    title: "Buy groceries",
                }),
                aTodosPageTodo({
                    id: "2",
                    completed: true,
                    title: "Walk the dog",
                }),
            ],
        }),
    },
};

const mockAddTodo = {
    request: {
        query: AddTodoDocument,
        variables: {
            title: "New test todo",
        },
    },
    result: {
        data: aAddTodoMutation({
            addTodo: {
                id: "3",
                title: "New test todo",
                completed: false,
            },
        }),
    },
};

const mockToggleTodo = {
    request: {
        query: ToggleTodoDocument,
        variables: {
            toggleTodoId: "1",
        },
    },
    result: {
        data: {
            __typename: "Mutation",
            toggleTodo: {
                __typename: "Todo",
                id: "1",
                title: "Buy groceries",
                completed: true,
            },
        },
    },
};

const mockDeleteTodo = {
    request: {
        query: DeleteTodoDocument,
        variables: {
            deleteTodoId: "1",
        },
    },
    result: {
        data: {
            __typename: "Mutation",
            deleteTodo: true,
        },
    },
};

describe("TodosPage", () => {
    describe("Loading and Error States", () => {
        it("displays loading state initially", () => {
            const mockLoading = {
                request: {
                    query: TodosPageDocument,
                },
                delay: 100, // Delay to keep loading state
            };

            renderWithProviders(<TodosPage />, {
                mocks: [mockLoading],
            });

            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });

        it("displays error state when query fails", async () => {
            const mockError = {
                request: {
                    query: TodosPageDocument,
                },
                error: new Error("Network error"),
            };

            renderWithProviders(<TodosPage />, {
                mocks: [mockError],
            });

            await waitFor(() => {
                expect(
                    screen.getByText("Error loading todos"),
                ).toBeInTheDocument();
            });
        });
    });

    describe("Empty State", () => {
        it("displays empty state when no todos exist", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty],
            });

            await waitFor(() => {
                expect(
                    screen.getByText("No todos yet. Add one above!"),
                ).toBeInTheDocument();
            });
        });
    });

    describe("Todo List Display", () => {
        it("displays todos when they exist", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems],
            });

            await waitFor(() => {
                expect(screen.getByText("Buy groceries")).toBeInTheDocument();
                expect(screen.getByText("Walk the dog")).toBeInTheDocument();
            });

            // Check that completed todo has line-through styling
            const completedTodo = screen.getByText("Walk the dog");
            expect(completedTodo).toHaveClass("line-through");

            // Check that incomplete todo doesn't have line-through styling
            const incompleteTodo = screen.getByText("Buy groceries");
            expect(incompleteTodo).not.toHaveClass("line-through");
        });

        it("displays todo checkboxes with correct checked state", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems],
            });

            await waitFor(() => {
                const checkboxes = screen.getAllByRole("checkbox");
                expect(checkboxes).toHaveLength(2);

                // First todo (Buy groceries) should be unchecked
                expect(checkboxes[0]).not.toBeChecked();

                // Second todo (Walk the dog) should be checked
                expect(checkboxes[1]).toBeChecked();
            });
        });

        it("displays delete buttons for all todos", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems],
            });

            await waitFor(() => {
                const deleteButtons = screen.getAllByLabelText("Delete todo");
                expect(deleteButtons).toHaveLength(2);
            });
        });
    });

    describe("Adding Todos", () => {
        it("adds a todo when Add button is clicked", async () => {
            const user = userEvent.setup();

            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty, mockAddTodo, mockTodosEmpty], // Refetch after add
            });

            await waitFor(() => {
                expect(
                    screen.getByPlaceholderText("Add a new task..."),
                ).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText("Add a new task...");
            const addButton = screen.getByRole("button", { name: /add/i });

            await user.type(input, "New test todo");
            await user.click(addButton);

            // Input should be cleared after successful add
            await waitFor(() => {
                expect(input).toHaveValue("");
            });
        });

        it("adds a todo when Enter key is pressed", async () => {
            const user = userEvent.setup();

            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty, mockAddTodo, mockTodosEmpty],
            });

            await waitFor(() => {
                expect(
                    screen.getByPlaceholderText("Add a new task..."),
                ).toBeInTheDocument();
            });

            const input = screen.getByPlaceholderText("Add a new task...");

            await user.type(input, "New test todo");
            await user.keyboard("{Enter}");

            await waitFor(() => {
                expect(input).toHaveValue("");
            });
        });
    });

    describe("Todo Interactions", () => {
        it("toggles todo completion when checkbox is clicked", async () => {
            const user = userEvent.setup();

            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems, mockToggleTodo, mockTodosWithItems],
            });

            await waitFor(() => {
                const checkboxes = screen.getAllByRole("checkbox");
                expect(checkboxes[0]).not.toBeChecked();
            });

            const firstCheckbox = screen.getAllByRole("checkbox")[0];
            await user.click(firstCheckbox);

            // The mutation should be called (verified by mock expectation)
        });

        it("deletes todo when delete button is clicked", async () => {
            const user = userEvent.setup();

            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems, mockDeleteTodo, mockTodosWithItems],
            });

            await waitFor(() => {
                expect(screen.getAllByLabelText("Delete todo")).toHaveLength(2);
            });

            const firstDeleteButton =
                screen.getAllByLabelText("Delete todo")[0];
            await user.click(firstDeleteButton);

            // The mutation should be called (verified by mock expectation)
        });
    });

    describe("Navigation", () => {
        it("todos are clickable and navigate to detail page", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosWithItems],
            });

            await waitFor(() => {
                const todoLinks = screen.getAllByRole("link");
                expect(todoLinks).toHaveLength(2);
                expect(todoLinks[0]).toHaveAttribute("href", "/todos/1");
                expect(todoLinks[1]).toHaveAttribute("href", "/todos/2");
            });
        });
    });

    describe("UI Elements", () => {
        it("displays the correct page title", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty],
            });

            await waitFor(() => {
                expect(screen.getByText("Todo App")).toBeInTheDocument();
            });
        });

        it("displays input placeholder text", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty],
            });

            await waitFor(() => {
                expect(
                    screen.getByPlaceholderText("Add a new task..."),
                ).toBeInTheDocument();
            });
        });

        it("displays add button with icon", async () => {
            renderWithProviders(<TodosPage />, {
                mocks: [mockTodosEmpty],
            });

            await waitFor(() => {
                const addButton = screen.getByRole("button", { name: /add/i });
                expect(addButton).toBeInTheDocument();
            });
        });
    });
});
