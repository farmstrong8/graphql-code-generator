import { Trash } from "lucide-react";
import { Link } from "react-router-dom";
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
        <div className="grid items-center grid-cols-[36px_1fr_36px] gap-2 p-3 bg-white border rounded-md shadow-sm">
            <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => onToggle(todo.id)}
            />
            <Link to={`/todos/${todo.id}`} className="w-full">
                <label
                    htmlFor={`todo-${todo.id}`}
                    className={`text-sm font-medium block w-full truncate ${
                        todo.completed
                            ? "line-through text-muted-foreground"
                            : ""
                    }`}
                >
                    {todo.title}
                </label>
            </Link>
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
