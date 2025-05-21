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
        id: "5030c6a2-c9b3-4198-876f-25e8ad308ff3";
        title: "Est dolor ipsa ipsa culpa.";
        completed: true;
    };
};

export const aAddTodoMutation = createBuilder<AddTodoMutation>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "5030c6a2-c9b3-4198-876f-25e8ad308ff3",
        title: "Est dolor ipsa ipsa culpa.",
        completed: true,
    },
});

type DeleteTodoMutation = {
    __typename: "Mutation";
    deleteTodo: true;
};

export const aDeleteTodoMutation = createBuilder<DeleteTodoMutation>({
    __typename: "Mutation",
    deleteTodo: true,
});

type TodoDetailsPageQuery = {
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "673c52d1-870e-4faa-aaf8-7e4a29fce454";
        title: "Quasi explicabo esse officiis est voluptatem.";
        completed: true;
    };
};

export const aTodoDetailsPageQuery = createBuilder<TodoDetailsPageQuery>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "673c52d1-870e-4faa-aaf8-7e4a29fce454",
        title: "Quasi explicabo esse officiis est voluptatem.",
        completed: true,
    },
});

type TodosPageQuery = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "7781e65b-74f4-4e8c-b1c3-a1fa5d76b472";
        title: "Natus suscipit ipsam nesciunt eligendi quia.";
        completed: true;
    };
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "7781e65b-74f4-4e8c-b1c3-a1fa5d76b472",
        title: "Natus suscipit ipsam nesciunt eligendi quia.",
        completed: true,
    },
});

type ToggleTodoMutation = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "ef3f73b2-bfe7-4998-95c3-b7bc318c0cbf";
        title: "Recusandae enim et cupiditate aut magnam omnis.";
        completed: true;
    };
};

export const aToggleTodoMutation = createBuilder<ToggleTodoMutation>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "ef3f73b2-bfe7-4998-95c3-b7bc318c0cbf",
        title: "Recusandae enim et cupiditate aut magnam omnis.",
        completed: true,
    },
});
