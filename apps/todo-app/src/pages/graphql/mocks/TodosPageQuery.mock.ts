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
        id: "1ffd2ae3-4af6-4ca6-9475-6271c2219feb";
        title: "Deleniti asperiores perspiciatis est.";
        completed: false;
        dueAt: "1993-11-27";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "1ffd2ae3-4af6-4ca6-9475-6271c2219feb",
        title: "Deleniti asperiores perspiciatis est.",
        completed: false,
        dueAt: "1993-11-27",
        author: {
            __typename: "Author",
        },
    },
});
