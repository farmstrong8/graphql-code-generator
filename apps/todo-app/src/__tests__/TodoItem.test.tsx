import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TodoItem } from "../components/todo-item";
import { renderWithProviders } from "../test/utils";
import type { Todo } from "../types.generated";

// Mock todo data
const mockTodoIncomplete: Todo = {
    __typename: "Todo",
    id: "1",
    title: "Buy groceries",
    completed: false,
    dueAt: "2025-06-01",
    createdAt: "2025-05-31",
    tags: ["shopping", "urgent"],
    author: {
        __typename: "Author",
        id: "author-1",
        name: "John Doe",
        email: "john@example.com"
    }
};

const mockTodoCompleted: Todo = {
    __typename: "Todo",
    id: "2", 
    title: "Walk the dog",
    completed: true,
    dueAt: null,
    createdAt: "2025-05-30",
    tags: ["exercise"],
    author: {
        __typename: "Author",
        id: "author-1",
        name: "John Doe",
        email: "john@example.com"
    }
};

const mockTodoLongTitle: Todo = {
    __typename: "Todo",
    id: "3",
    title: "This is a very long todo title that should be truncated when displayed in the todo item component",
    completed: false,
    dueAt: "2025-12-31",
    createdAt: "2025-05-31",
    tags: ["long", "test"],
    author: {
        __typename: "Author",
        id: "author-2", 
        name: "Jane Smith",
        email: "jane@example.com"
    }
};

describe("TodoItem", () => {
    const mockOnToggle = vi.fn();
    const mockOnDelete = vi.fn();

    beforeEach(() => {
        mockOnToggle.mockClear();
        mockOnDelete.mockClear();
    });

    describe("Rendering", () => {
        it("renders todo title correctly", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            expect(screen.getByText("Buy groceries")).toBeInTheDocument();
        });

        it("renders checkbox with correct checked state for incomplete todo", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).not.toBeChecked();
        });

        it("renders checkbox with correct checked state for completed todo", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoCompleted}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            expect(checkbox).toBeChecked();
        });

        it("renders delete button", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const deleteButton = screen.getByLabelText("Delete todo");
            expect(deleteButton).toBeInTheDocument();
        });

        it("renders todo as a link to detail page", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const link = screen.getByRole("link");
            expect(link).toHaveAttribute("href", "/todos/1");
        });
    });

    describe("Styling", () => {
        it("applies line-through styling to completed todo", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoCompleted}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const todoTitle = screen.getByText("Walk the dog");
            expect(todoTitle).toHaveClass("line-through");
            expect(todoTitle).toHaveClass("text-muted-foreground");
        });

        it("does not apply line-through styling to incomplete todo", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const todoTitle = screen.getByText("Buy groceries");
            expect(todoTitle).not.toHaveClass("line-through");
            expect(todoTitle).not.toHaveClass("text-muted-foreground");
        });

        it("truncates long todo titles", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoLongTitle}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const todoTitle = screen.getByText(mockTodoLongTitle.title);
            expect(todoTitle).toHaveClass("truncate");
        });

        it("has correct grid layout classes", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const container = screen.getByText("Buy groceries").closest("div");
            expect(container).toHaveClass("grid");
            expect(container).toHaveClass("items-center");
            expect(container).toHaveClass("grid-cols-[36px_1fr_36px]");
        });
    });

    describe("Interactions", () => {
        it("calls onToggle when checkbox is clicked", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            await user.click(checkbox);

            expect(mockOnToggle).toHaveBeenCalledTimes(1);
            expect(mockOnToggle).toHaveBeenCalledWith("1");
        });

        it("calls onDelete when delete button is clicked", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const deleteButton = screen.getByLabelText("Delete todo");
            await user.click(deleteButton);

            expect(mockOnDelete).toHaveBeenCalledTimes(1);
            expect(mockOnDelete).toHaveBeenCalledWith("1");
        });

        it("does not call callbacks when title link is clicked", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const link = screen.getByRole("link");
            await user.click(link);

            expect(mockOnToggle).not.toHaveBeenCalled();
            expect(mockOnDelete).not.toHaveBeenCalled();
        });
    });

    describe("Accessibility", () => {
        it("has proper aria labels", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const deleteButton = screen.getByLabelText("Delete todo");
            expect(deleteButton).toBeInTheDocument();
        });

        it("has proper checkbox labeling", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            const label = screen.getByLabelText("Buy groceries");
            
            expect(checkbox).toHaveAttribute("id", "todo-1");
            // In React, we use htmlFor which maps to the 'for' attribute in HTML
            expect(label).toHaveAttribute("htmlFor", "todo-1");
        });

        it("maintains focus management", async () => {
            const user = userEvent.setup();
            
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoIncomplete}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            const checkbox = screen.getByRole("checkbox");
            await user.tab(); // Should focus first interactive element
            
            expect(checkbox).toHaveFocus();
        });
    });

    describe("Different Todo States", () => {
        it("handles todos with null dueAt", () => {
            const todoWithNullDue: Todo = {
                ...mockTodoIncomplete,
                dueAt: null
            };

            renderWithProviders(
                <TodoItem 
                    todo={todoWithNullDue}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            expect(screen.getByText("Buy groceries")).toBeInTheDocument();
        });

        it("handles todos with different authors", () => {
            renderWithProviders(
                <TodoItem 
                    todo={mockTodoLongTitle}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            expect(screen.getByText(mockTodoLongTitle.title)).toBeInTheDocument();
        });

        it("handles special characters in todo titles", () => {
            const todoWithSpecialChars: Todo = {
                ...mockTodoIncomplete,
                title: "Buy groceries & cook dinner! 🍳"
            };

            renderWithProviders(
                <TodoItem 
                    todo={todoWithSpecialChars}
                    onToggle={mockOnToggle}
                    onDelete={mockOnDelete}
                />
            );

            expect(screen.getByText("Buy groceries & cook dinner! 🍳")).toBeInTheDocument();
        });
    });
});
