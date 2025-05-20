import { Trash } from "lucide-react";
import type { Todo } from "@/types.generated";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export const TodoItem = ({ todo, onToggle, onDelete }: TodoItemProps) => {
    return (
        <div className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm">
            <div className="flex items-center space-x-3">
                <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => onToggle(todo.id)}
                />
                <label
                    htmlFor={`todo-${todo.id}`}
                    className={`text-sm font-medium ${
                        todo.completed
                            ? "line-through text-muted-foreground"
                            : ""
                    }`}
                >
                    {todo.title}
                </label>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(todo.id)}
                aria-label="Delete todo"
            >
                <Trash className="h-4 w-4 text-red-500" />
            </Button>
        </div>
    );
};
