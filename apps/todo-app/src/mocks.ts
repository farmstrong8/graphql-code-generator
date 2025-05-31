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
        id: "bf1c328c-27d0-4e41-838e-f0c6af5a803a";
        title: "Et nihil nihil aut.";
        completed: true;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "bf1c328c-27d0-4e41-838e-f0c6af5a803a",
        title: "Et nihil nihil aut.",
        completed: true,
    },
});

type AuthorFragmentFragment = {
    __typename: "Author";
    id: "d2b416ff-b7ad-4199-b8ea-e3b9f587b016";
    name: "Commodi sint ullam enim voluptas.";
};

export const aAuthorFragmentFragment = createBuilder<AuthorFragmentFragment>({
    __typename: "Author",
    id: "d2b416ff-b7ad-4199-b8ea-e3b9f587b016",
    name: "Commodi sint ullam enim voluptas.",
});

type DeleteTodo = {
    __typename: "Mutation";
    deleteTodo: false;
};

export const aDeleteTodo = createBuilder<DeleteTodo>({
    __typename: "Mutation",
    deleteTodo: false,
});

type TodoDetailsPage = {
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "c1b8acc1-155e-4894-8afe-e414ab03e508";
        title: "Beatae molestiae reiciendis eligendi aut.";
        completed: true;
    };
};

export const aTodoDetailsPage = createBuilder<TodoDetailsPage>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "c1b8acc1-155e-4894-8afe-e414ab03e508",
        title: "Beatae molestiae reiciendis eligendi aut.",
        completed: true,
    },
});

type TodosPage = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "1bfd49e8-8b2c-4811-9663-3fece8ab0b77";
        title: "Molestiae laboriosam ut.";
        completed: false;
        dueAt: "1979-12-07";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "1bfd49e8-8b2c-4811-9663-3fece8ab0b77",
        title: "Molestiae laboriosam ut.",
        completed: false,
        dueAt: "1979-12-07",
        author: {
            __typename: "Author",
        },
    },
});

type ToggleTodo = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "8c20f617-823a-4801-88dd-8359a0601ac9";
        title: "Adipisci ut illo odit voluptatem.";
        completed: true;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "8c20f617-823a-4801-88dd-8359a0601ac9",
        title: "Adipisci ut illo odit voluptatem.",
        completed: true,
    },
});
