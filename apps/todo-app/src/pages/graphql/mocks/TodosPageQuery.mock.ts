import * as Types from "../../../types.generated";

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
    id: "faedaa0c-4181-4907-a5e2-1ff367888815",
    title: "Laudantium dicta nemo voluptatem qui eveniet adipisci non porro non.",
    completed: false,
    dueAt: "2000-05-31",
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
