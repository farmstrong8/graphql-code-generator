import { merge } from "lodash";

type DeepPartial<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

function createBuilder<T extends object>(base: T) {
    return (overrides?: DeepPartial<T>): T => merge({}, base, overrides);
}

type AddTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aAddTodoTodo = createBuilder<AddTodoTodo>({
    __typename: "Todo",
    id: "cdc122e5-8627-456e-8c39-b6a318e5ab77",
    title: "Enim voluptatem eum iste reprehenderit.",
    completed: false,
});

type AddTodoMutation = {
    __typename: "Mutation";
    addTodo: AddTodoTodo;
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: aAddTodoTodo(),
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "76aa8abe-8ec9-4508-a523-4616c0088b0a",
    name: "Quisquam illo rem qui voluptatem dolorem voluptas ut.",
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: boolean;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: false,
});

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        __typename: "Todo";
    };
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: {
            __typename: "Todo",
            id: "1fb11e27-cf69-458b-bbc2-ad056927ec29",
            title: "Voluptatem reprehenderit sed non perferendis praesentium aut.",
            completed: false,
        },
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: {
        message: string;
        __typename: "Error";
    };
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: {
            __typename: "Error",
            message:
                "Voluptates laudantium quis perferendis est voluptatibus sed earum libero.",
        },
    });

type TodosPageTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
        id: string;
        name: string;
    };
};

export const aTodosPageTodo = createBuilder<TodosPageTodo>({
    __typename: "Todo",
    id: "384abad0-4e41-453d-be0f-5a515dd3d7c9",
    title: "Aliquid totam rerum voluptatem sapiente.",
    completed: false,
    dueAt: "1972-09-23",
    author: {
        __typename: "Author",
        id: "486dbffe-10d1-4d99-a220-fe1ad9613012",
        name: "Enim totam nihil.",
    },
});

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<TodosPageTodo>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [aTodosPageTodo()],
});

type AuthorInlineFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorInlineFragmentFragment =
    createBuilder<AuthorInlineFragmentFragment>({
        __typename: "Author",
        id: "33d29672-a938-46a4-a6d6-81b91c92ba9c",
        name: "Non occaecati omnis itaque et blanditiis ea amet.",
    });

type TodosPageWithInlineFragmentTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
        id: string;
        name: string;
    };
};

export const aTodosPageWithInlineFragmentTodo =
    createBuilder<TodosPageWithInlineFragmentTodo>({
        __typename: "Todo",
        id: "7ae6c217-005c-4395-9835-79601eeb8ecc",
        title: "Perspiciatis possimus at occaecati vel.",
        completed: false,
        dueAt: "2013-04-11",
        author: {
            __typename: "Author",
            id: "5b48a3e1-6d95-4f2a-aec1-1f4b270d293a",
            name: "Et tenetur laborum excepturi eum.",
        },
    });

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<TodosPageWithInlineFragmentTodo>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [aTodosPageWithInlineFragmentTodo()],
    });

type ToggleTodoTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
};

export const aToggleTodoTodo = createBuilder<ToggleTodoTodo>({
    __typename: "Todo",
    id: "b9b83d32-9c23-4ad0-8828-69a968bdaa18",
    title: "Facere ipsam voluptatem sed ipsam cum.",
    completed: true,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: ToggleTodoTodo;
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoTodo(),
});
