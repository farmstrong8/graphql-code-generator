import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { BrowserRouter } from "react-router-dom";
import { TodosPage } from "../pages/TodosPage";
import { render } from "@testing-library/react";
import { 
    TodosPageDocument
} from "../pages/graphql/generated/TodosPageQuery";
import { aTodosPage } from "../pages/graphql/mocks/TodosPageQuery.mock";

describe("Apollo Client Integration with Generated Mocks", () => {
    function renderWithApollo(mocks: any[] = []) {
        return render(
            <MockedProvider mocks={mocks} addTypename={false}>
                <BrowserRouter>
                    <TodosPage />
                </BrowserRouter>
            </MockedProvider>
        );
    }

    describe("Query Integration", () => {
        it("successfully fetches and displays todos using generated mocks", async () => {
            const mockTodos = [
                {
                    request: {
                        query: TodosPageDocument,
                    },
                    result: {
                        data: aTodosPage(), // Use default generated mock
                    },
                },
            ];

            renderWithApollo(mockTodos);

            await waitFor(() => {
                // Check for default mock data
                expect(screen.getByText("Nobis asperiores similique.")).toBeInTheDocument();
            });
        });

        it("handles empty todos list correctly", async () => {
            const emptyTodosMock = [
                {
                    request: {
                        query: TodosPageDocument,
                    },
                    result: {
                        data: {
                            __typename: "Query",
                            todos: [],
                        },
                    },
                },
            ];

            renderWithApollo(emptyTodosMock);

            await waitFor(() => {
                expect(screen.getByText("No todos found. Add your first todo!")).toBeInTheDocument();
            });
        });
    });

    describe("Mock Data Validation", () => {
        it("validates TodosPage mock structure", () => {
            const mockData = aTodosPage();
            
            expect(mockData).toHaveProperty("__typename", "Query");
            expect(mockData).toHaveProperty("todos");
            expect(Array.isArray(mockData.todos)).toBe(true);
            
            if (mockData.todos.length > 0) {
                const firstTodo = mockData.todos[0];
                expect(firstTodo).toHaveProperty("id");
                expect(firstTodo).toHaveProperty("title");
                expect(firstTodo).toHaveProperty("completed");
                expect(firstTodo).toHaveProperty("dueAt");
                expect(firstTodo).toHaveProperty("author");
            }
        });
    });
});
