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
        id: "be4ef751-1003-4f1e-9368-ae01d91c76d1";
        title: "Nobis asperiores similique.";
        completed: true;
        dueAt: "1973-10-08";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "be4ef751-1003-4f1e-9368-ae01d91c76d1",
        title: "Nobis asperiores similique.",
        completed: true,
        dueAt: "1973-10-08",
        author: {
            __typename: "Author",
        },
    },
});
