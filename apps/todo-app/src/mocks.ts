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
        id: "ce326bba-565b-48ca-96d7-246765d2f096";
        title: "Temporibus quos expedita et architecto est dolorem dolore labore.";
        completed: true;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "ce326bba-565b-48ca-96d7-246765d2f096",
        title: "Temporibus quos expedita et architecto est dolorem dolore labore.",
        completed: true,
    },
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: "f21f160f-8994-4015-a9e3-6b0860711851";
    name: "Ut recusandae qui earum.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "f21f160f-8994-4015-a9e3-6b0860711851",
    name: "Ut recusandae qui earum.",
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
        id: "7e9c3bfd-5a68-4787-bd54-4f2814a2e610";
        title: "Ut facilis aut voluptatem dicta hic qui quae eveniet.";
        completed: false;
    };
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "7e9c3bfd-5a68-4787-bd54-4f2814a2e610",
        title: "Ut facilis aut voluptatem dicta hic qui quae eveniet.",
        completed: false,
    },
});

type TodoDetailsPageAsError = {
    __typename: "Query";
    todo: {
        __typename: "Error";
        message: "Vero quas ut voluptatem rerum fugiat fuga minus qui.";
    };
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Vero quas ut voluptatem rerum fugiat fuga minus qui.",
    },
});

type TodosPage = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "acc381dd-e620-4280-a011-b5cf602a2e95";
        title: "Nobis quia distinctio quas vel autem.";
        completed: true;
        dueAt: "1989-08-25";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "acc381dd-e620-4280-a011-b5cf602a2e95",
        title: "Nobis quia distinctio quas vel autem.",
        completed: true,
        dueAt: "1989-08-25",
        author: {
            __typename: "Author",
        },
    },
});

type ToggleTodo = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "3e046a98-edb0-4af8-89ba-13e4152e51c1";
        title: "Aut cum odio saepe ea rerum nostrum recusandae iure.";
        completed: true;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "3e046a98-edb0-4af8-89ba-13e4152e51c1",
        title: "Aut cum odio saepe ea rerum nostrum recusandae iure.",
        completed: true,
    },
});
