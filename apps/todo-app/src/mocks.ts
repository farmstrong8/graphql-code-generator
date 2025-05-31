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

type AddTodo = {
    addTodo: {
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "912a77fe-72df-4b42-8540-b349ca17e5d0",
        title: "Consequuntur doloribus placeat eos quam magnam natus tenetur rerum.",
        completed: false,
    },
});

type AuthorFragmentFragment = {
    id: string;
    name: string;
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "6ba26eb8-3933-4f7b-94bc-b7448d54d120",
    name: "Eum vel quo autem.",
});

type DeleteTodo = {
    deleteTodo: boolean;
};

export const aDeleteTodo = createBuilder<DeleteTodo>({
    __typename: "Mutation",
    deleteTodo: false,
});

type TodoDetailsPageAsTodo = {
    todo: object;
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "50d1b4e8-74a3-4f51-bc49-125a07e8fb99",
        title: "Magnam nihil officiis velit.",
        completed: true,
    },
});

type TodoDetailsPageAsError = {
    todo: object;
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Voluptas architecto dolor voluptatum id et.",
    },
});

type TodosPage = {
    todos: Array<{
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {};
    }>;
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "922793fb-39c0-4968-83c5-9d7478a97e11",
        title: "Quis repellendus sunt sunt delectus.",
        completed: true,
        dueAt: "1990-02-01",
        author: {
            __typename: "Author",
        },
    },
});

type TodosPageWithInlineFragment = {
    todos: Array<{
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {};
    }>;
};

export const aTodosPageWithInlineFragment =
    createBuilder<TodosPageWithInlineFragment>({
        __typename: "Query",
        todos: {
            __typename: "Todo",
            id: "6f79b277-1371-4c15-a674-52877f490d1a",
            title: "Et autem alias animi voluptas voluptatum.",
            completed: true,
            dueAt: "2015-11-25",
            author: {
                __typename: "Author",
            },
        },
    });

type ToggleTodo = {
    toggleTodo: {
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "3d14eaad-faa7-4999-a4e7-f5e07ddf7eb8",
        title: "Aut est natus porro tenetur ab id ducimus non.",
        completed: true,
    },
});
