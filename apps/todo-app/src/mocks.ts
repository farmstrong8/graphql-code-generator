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
    id: "f80c8518-45fd-404e-afdc-3414c239dea3",
    title: "Consectetur reprehenderit aut consequatur.",
    completed: true,
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
    id: "8cbcc4c1-36c8-45f6-903e-484e0f264f26",
    name: "Minus porro qui vero voluptatem minus autem porro voluptatibus.",
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: boolean;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: true,
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
            id: "a2da63f5-fe06-48fd-be5b-ccb621f4e01d",
            title: "Repellendus non qui praesentium magnam.",
            completed: true,
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
            message: "Totam ratione quod aliquam soluta nemo omnis.",
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
    id: "6ea379ac-480c-4903-a8e4-3224ace8804d",
    title: "Molestias at vitae hic voluptatem molestiae placeat corrupti quam fugiat.",
    completed: false,
    dueAt: "1981-04-02",
    author: {
        __typename: "Author",
        id: "591102c4-0d03-4e23-8c0f-9305cb321305",
        name: "Porro fugiat voluptas dolores.",
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
        id: "df6c0d42-69a8-4fc7-8119-571158160dac",
        name: "Suscipit labore quisquam qui sint odit.",
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
        id: "17b94599-99f8-41eb-9a50-721b3bc1f676",
        title: "Libero minus consectetur et quod consequatur et.",
        completed: true,
        dueAt: "1973-06-24",
        author: {
            __typename: "Author",
            id: "75133af8-c191-4674-b001-ec6fe1928963",
            name: "Accusamus beatae voluptatem eligendi nihil velit explicabo.",
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
    id: "1fedfd5b-7737-4978-8788-c70da8b71e50",
    title: "Omnis et quia expedita quod laborum non reiciendis.",
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
