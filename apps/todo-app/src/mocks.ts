import { mergeWith } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

function createBuilder<T extends object>(baseObject: T) {
    return (overrides?: DeepPartial<T>): T =>
        mergeWith({}, baseObject, overrides, (objValue, srcValue) => {
            if (Array.isArray(objValue) && Array.isArray(srcValue)) {
                return srcValue;
            }
        });
}

type AddTodoAddTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoAddTodo = createBuilder<AddTodoAddTodo>({
    __typename: "Todo",
    id: "b06963e1-348f-410e-a343-8ecd8c1d2df3",
    title: "A facilis quam provident assumenda.",
    completed: true,
});

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: aAddTodoAddTodo(),
});

type AuthorFragment = { __typename: "Author"; id: string; name: string };

export const aAuthorFragment = createBuilder<AuthorFragment>({
    __typename: "Author",
    id: "9ba5f832-14f9-4501-97a1-96bc781a7885",
    name: "Dolorem modi rerum ut eos ut.",
});

type DeleteTodoMutation = { __typename: "Mutation"; deleteTodo: boolean };

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: true,
});

type TodoDetailsPageQueryAsTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aTodoDetailsPageQueryAsTodoTodo =
    createBuilder<TodoDetailsPageQueryAsTodoTodo>({
        __typename: "Todo",
        id: "b9a61a92-0d83-4fe4-b58b-e3d2deb0626a",
        title: "Quo rerum et in rerum quod.",
        completed: true,
    });

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsTodoTodo;
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsTodoTodo(),
    });

type TodoDetailsPageQueryAsErrorError = {
    __typename: "Error";
    message: string;
};

export const aTodoDetailsPageQueryAsErrorError =
    createBuilder<TodoDetailsPageQueryAsErrorError>({
        __typename: "Error",
        message: "Ea sed aliquid aut fugit.",
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: TodoDetailsPageQueryAsErrorError;
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: aTodoDetailsPageQueryAsErrorError(),
    });

type TodosPageTodosAuthor = { __typename: "Author"; id: string; name: string };

export const aTodosPageTodosAuthor = createBuilder<TodosPageTodosAuthor>({
    __typename: "Author",
    id: "6f0317a7-af00-40b7-b163-282ef619bbf8",
    name: "Et earum consequatur quaerat voluptatem aut ullam et.",
});

type TodosPageTodos = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt?: string;
    status: "CANCELLED" | "COMPLETED" | "DRAFT" | "IN_PROGRESS";
    author: { __typename: "Author"; id: string; name: string };
};

export const aTodosPageTodos = createBuilder<TodosPageTodos>({
    __typename: "Todo",
    id: "5de1a09a-b27b-472b-8a3a-271c24fd973e",
    title: "Illo sequi id voluptatum mollitia et et non quidem corporis.",
    completed: true,
    dueAt: "2014-03-11",
    status: "CANCELLED",
    author: aTodosPageTodosAuthor(),
});

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt?: string;
        status: "CANCELLED" | "COMPLETED" | "DRAFT" | "IN_PROGRESS";
        author: { __typename: "Author"; id: string; name: string };
    }>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodos()],
});

type AuthorInlineFragment = { __typename: "Author"; id: string; name: string };

export const aAuthorInlineFragment = createBuilder<AuthorInlineFragment>({
    __typename: "Author",
    id: "09d43baa-09ed-4cc7-b840-45bc7806312c",
    name: "Maxime nobis vero est.",
});

type TodosPageWithInlineFragmentTodosAuthor = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aTodosPageWithInlineFragmentTodosAuthor =
    createBuilder<TodosPageWithInlineFragmentTodosAuthor>({
        __typename: "Author",
        id: "2f19c108-c48e-461c-b61a-0cdf71acd279",
        name: "Modi necessitatibus sed praesentium omnis eius possimus voluptatum.",
    });

type TodosPageWithInlineFragmentTodos = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt?: string;
    author: { __typename: "Author"; id: string; name: string };
};

export const aTodosPageWithInlineFragmentTodos =
    createBuilder<TodosPageWithInlineFragmentTodos>({
        __typename: "Todo",
        id: "09a23efb-f2b1-4967-93d6-ed66b1df8132",
        title: "Animi doloremque fuga consequatur nesciunt vitae velit.",
        completed: true,
        dueAt: "1976-04-24",
        author: aTodosPageWithInlineFragmentTodosAuthor(),
    });

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt?: string;
        author: { __typename: "Author"; id: string; name: string };
    }>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [aTodosPageWithInlineFragmentTodos()],
    });

type ToggleTodoToggleTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoToggleTodo = createBuilder<ToggleTodoToggleTodo>({
    __typename: "Todo",
    id: "cfe4f94d-420c-400d-8a79-aa4b15e8f047",
    title: "Accusantium quod sit laborum odio expedita cupiditate.",
    completed: true,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo?: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoToggleTodo(),
});
