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
    id: "b5ae7a98-09e9-4d5e-8757-0ed19a627b37",
    title: "Ut incidunt nam.",
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
    id: "6ce9313a-b1ce-4de4-ae90-ad8cac0eb51d",
    name: "Quia dolores vel consequatur et in accusamus deleniti animi ad.",
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
            id: "cf2fe330-4561-4d6f-b1e9-4c2baef02d18",
            title: "Quibusdam sed et ut asperiores dolor odio dignissimos occaecati.",
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
            message: "Eum eos qui voluptatum neque harum aspernatur.",
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
    };
};

export const aTodosPageTodo = createBuilder<TodosPageTodo>({
    __typename: "Todo",
    id: "956ab18b-1b99-4228-8494-13d70ead0462",
    title: "Nesciunt sed neque eum sit sit non expedita.",
    completed: false,
    dueAt: "1984-02-14",
    author: {
        __typename: "Author",
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

type TodosPageWithInlineFragmentTodo = {
    __typename: "Todo";
    id: string;
    title: string;
    completed: boolean;
    dueAt: string;
    author: {
        __typename: "Author";
    };
};

export const aTodosPageWithInlineFragmentTodo =
    createBuilder<TodosPageWithInlineFragmentTodo>({
        __typename: "Todo",
        id: "3e2bbcd3-7a6c-4ba4-be0f-45e301c8f321",
        title: "Dignissimos quibusdam ut id vero non excepturi id excepturi.",
        completed: true,
        dueAt: "1989-11-09",
        author: {
            __typename: "Author",
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
    id: "4148427b-11af-49e8-a88f-0ac3e7cabd7e",
    title: "Unde aperiam occaecati magnam.",
    completed: false,
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: ToggleTodoTodo;
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: aToggleTodoTodo(),
});
