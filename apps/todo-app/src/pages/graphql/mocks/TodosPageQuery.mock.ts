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

type TodosPage = {
    __typename: "Query";
    todos: {
        __typename: "Todo";
        id: "b476f11e-c456-42d3-a26c-4f3b6ac608ef";
        title: "Sint accusantium rem rerum laborum.";
        completed: true;
        dueAt: "2000-01-11";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "b476f11e-c456-42d3-a26c-4f3b6ac608ef",
        title: "Sint accusantium rem rerum laborum.",
        completed: true,
        dueAt: "2000-01-11",
        author: {
            __typename: "Author",
        },
    },
});
