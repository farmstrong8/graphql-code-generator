import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoItem } from "@/components/todo-item";
import {
    useTodosPageQuery,
    namedOperations,
} from "./graphql/generated/TodosPageQuery";
import { useAddTodoMutation } from "./graphql/generated/AddTodoMutation";
import { useDeleteTodoMutation } from "./graphql/generated/DeleteTodoMutation";
import { useToggleTodoMutation } from "./graphql/generated/ToggleTodoMutation";

export const TodosPage: React.FC = () => {
    const [newTodo, setNewTodo] = useState("");

    const [addTodo] = useAddTodoMutation({
        onCompleted: () => {
            setNewTodo("");
        },
        refetchQueries: [namedOperations.Query.TodosPage],
    });

    const [toggleTodo] = useToggleTodoMutation({
        refetchQueries: [namedOperations.Query.TodosPage],
    });
    const [deleteTodo] = useDeleteTodoMutation({
        refetchQueries: [namedOperations.Query.TodosPage],
    });

    const { data, loading, error } = useTodosPageQuery();

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading todos</p>;
    if (!data) return <p>No data</p>;

    const todos = data.todos;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Todo App
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-2 mb-4">
                        <Input
                            placeholder="Add a new task..."
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    addTodo({
                                        variables: {
                                            title: newTodo,
                                        },
                                    });
                                }
                            }}
                        />
                        <Button
                            onClick={() => {
                                addTodo({
                                    variables: {
                                        title: newTodo,
                                    },
                                });
                            }}
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {todos.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No todos yet. Add one above!
                            </p>
                        ) : (
                            todos.map((todo) => (
                                <TodoItem
                                    key={todo.id}
                                    todo={todo}
                                    onToggle={(id) =>
                                        toggleTodo({
                                            variables: {
                                                toggleTodoId: id,
                                            },
                                        })
                                    }
                                    onDelete={(id) =>
                                        deleteTodo({
                                            variables: {
                                                deleteTodoId: id,
                                            },
                                        })
                                    }
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
