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
    addTodo: {
        __typename: "Todo",
        id: "0c2c821d-6cb2-42da-8d1f-fe25587c0565",
        title: "Sequi non at sed fugit tempora.",
        completed: true,
    },
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "fe659d06-ab20-4159-9a23-6b89472ed85f",
    name: "Sit laudantium molestias.",
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
        message: string;
        __typename: "Todo" | "Error";
    };
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: {
            __typename: "Todo",
            id: "78204fb0-3272-40dd-abf4-741c1e1c4c80",
            title: "Corrupti enim aliquid sapiente tempora nihil qui.",
            completed: false,
        },
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        message: string;
        __typename: "Todo" | "Error";
    };
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: {
            __typename: "Error",
            message:
                "Voluptas quas beatae reiciendis eius nulla adipisci totam veritatis.",
        },
    });

type TodosPageQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {
            __typename: "Author";
        };
    }>;
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: [
        {
            __typename: "Todo",
            id: "d2d69b41-6e0a-4441-bdb1-8c80d57451d2",
            title: "Eos et consectetur nesciunt.",
            completed: false,
            dueAt: "1986-09-11",
            author: {
                __typename: "Author",
            },
        },
    ],
});

type TodosPageWithInlineFragmentQuery = {
    __typename: "Query";
    todos: Array<{
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {
            __typename: "Author";
        };
    }>;
};

export const aTodosPageWithInlineFragmentQuery =
    createBuilder<TodosPageWithInlineFragmentQuery>({
        __typename: "Query",
        todos: [
            {
                __typename: "Todo",
                id: "d3a95ea0-e518-49e3-bbf7-63c6bd348f71",
                title: "Eum et tempora neque vel at rem qui.",
                completed: true,
                dueAt: "1975-04-04",
                author: {
                    __typename: "Author",
                },
            },
        ],
    });

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "8a1eb894-9379-472b-90ed-9cd104cc2170",
        title: "Recusandae dolorem aliquid placeat laborum reiciendis.",
        completed: true,
    },
});
