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
        id: "id-1";
        title: "example";
        completed: false;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "id-1",
        title: "example",
        completed: false,
    },
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
        id: "id-1";
        title: "example";
        completed: false;
    };
};

export const aTodoDetailsPage = createBuilder<TodoDetailsPage>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "id-1",
        title: "example",
        completed: false,
    },
});

type TodosPage = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "id-1";
        title: "example";
        completed: false;
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "id-1",
        title: "example",
        completed: false,
    },
});

type ToggleTodo = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "id-1";
        title: "example";
        completed: false;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "id-1",
        title: "example",
        completed: false,
    },
});
