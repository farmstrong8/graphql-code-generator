import { useParams } from "react-router-dom";
import { useTodoDetailsPageQuery } from "./graphql/generated/TodoDetailsPageQuery";

type TodoDetailsPageRouteParams = {
    id: string;
};

export const TodoDetailPage = () => {
    const { id } = useParams<TodoDetailsPageRouteParams>();

    const { data, loading, error } = useTodoDetailsPageQuery({
        variables: { todoId: id! },
        skip: !id,
    });

    if (loading) return <p>Loading...</p>;
    if (error || !data?.todo) return <p>Todo not found</p>;

    const { title, completed } = data.todo;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-600 mt-2">
                Status: {completed ? "✅ Completed" : "🕒 In Progress"}
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                Toggle Complete
            </button>
        </div>
    );
};
