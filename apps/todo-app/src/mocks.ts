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
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: "de961afa-156e-43d2-bb00-63d2bd972bec";
        title: "Ad neque laudantium aliquam laboriosam nobis ut illo corporis.";
        completed: false;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "de961afa-156e-43d2-bb00-63d2bd972bec",
        title: "Ad neque laudantium aliquam laboriosam nobis ut illo corporis.",
        completed: false,
    },
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: "53c5c3a6-4d11-454f-8a3a-cd23e344e7c3";
    name: "Consequatur dolores corrupti voluptas saepe.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "53c5c3a6-4d11-454f-8a3a-cd23e344e7c3",
    name: "Consequatur dolores corrupti voluptas saepe.",
});

type DeleteTodo = {
    __typename: "Mutation";
    deleteTodo: true;
};

export const aDeleteTodo = createBuilder<DeleteTodo>({
    __typename: "Mutation",
    deleteTodo: true,
});

type TodoDetailsPageAsTodo = {
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "072ab3cc-0881-4ae1-9b0b-8a2664287de9";
        title: "Inventore praesentium voluptates mollitia ullam est ratione minima.";
        completed: false;
    };
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "072ab3cc-0881-4ae1-9b0b-8a2664287de9",
        title: "Inventore praesentium voluptates mollitia ullam est ratione minima.",
        completed: false,
    },
});

type TodoDetailsPageAsError = {
    __typename: "Query";
    todo: {
        __typename: "Error";
        message: "Nihil est consequatur.";
    };
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Nihil est consequatur.",
    },
});

type TodosPage = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "04ae5fd9-6989-4d57-a5d8-0f75f150b41a";
        title: "Voluptatem tempora et quo ipsum tempore ipsam alias et.";
        completed: true;
        dueAt: "2015-08-12";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "04ae5fd9-6989-4d57-a5d8-0f75f150b41a",
        title: "Voluptatem tempora et quo ipsum tempore ipsam alias et.",
        completed: true,
        dueAt: "2015-08-12",
        author: {
            __typename: "Author",
        },
    },
});

type TodosPageWithInlineFragment = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "99992114-92cb-4c3f-8b19-d49115d68dcd";
        title: "Fugit ad labore.";
        completed: false;
        dueAt: "1982-02-21";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPageWithInlineFragment =
    createBuilder<TodosPageWithInlineFragment>({
        __typename: "Query",
        todos: {
            __typename: "Todo",
            id: "99992114-92cb-4c3f-8b19-d49115d68dcd",
            title: "Fugit ad labore.",
            completed: false,
            dueAt: "1982-02-21",
            author: {
                __typename: "Author",
            },
        },
    });

type ToggleTodo = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "b8c0de89-c112-4644-b187-91b95d76400e";
        title: "Delectus eveniet ad iste corporis in aut.";
        completed: false;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "b8c0de89-c112-4644-b187-91b95d76400e",
        title: "Delectus eveniet ad iste corporis in aut.",
        completed: false,
    },
});
