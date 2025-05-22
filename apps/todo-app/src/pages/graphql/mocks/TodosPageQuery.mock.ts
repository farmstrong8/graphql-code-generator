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
    todos: {
        __typename: "Todo";
        id: "5cac3f2d-7f9d-4204-9308-b4e08e42f008";
        title: "Odio maxime hic nulla sunt repellendus dolorum aspernatur.";
        completed: true;
        dueAt: "1974-03-04";
    };
};

export const aTodosPageQuery = createBuilder<TodosPageQuery>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "5cac3f2d-7f9d-4204-9308-b4e08e42f008",
        title: "Odio maxime hic nulla sunt repellendus dolorum aspernatur.",
        completed: true,
        dueAt: "1974-03-04",
    },
});
