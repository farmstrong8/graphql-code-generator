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
            id: "1ad68707-e9f5-4fe7-aa0d-cb16f7206b74",
            title: "Est et quisquam nihil voluptatem et.",
            completed: false,
            dueAt: "2003-08-27",
            author: {
                __typename: "Author",
            },
        },
    ],
});
