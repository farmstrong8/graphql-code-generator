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
        id: string;
        name: string;
        email: string;
    };
};

export const aTodosPageTodo = createBuilder<TodosPageTodo>({
    __typename: "Todo",
    id: "8bde94c0-5756-4909-a4ec-5e9c5ebd259b",
    title: "Sint aliquid non cumque omnis nihil eveniet id ducimus.",
    completed: false,
    dueAt: "1974-08-20",
    author: {
        __typename: "Author",
        id: "ff0018e1-7510-4fa7-94d4-496f30778f90",
        name: "Rerum maxime dolor eum.",
        email: "Beatae ea sunt animi.",
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
