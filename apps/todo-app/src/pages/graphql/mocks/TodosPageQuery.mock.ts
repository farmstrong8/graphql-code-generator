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
        id: "b6a5856f-549e-4b99-af36-3d14df7aa65b";
        title: "Vel est praesentium sed.";
        completed: false;
        dueAt: "1994-10-04";
        author: {
            __typename: "Author";
        };
    };
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "b6a5856f-549e-4b99-af36-3d14df7aa65b",
        title: "Vel est praesentium sed.",
        completed: false,
        dueAt: "1994-10-04",
        author: {
            __typename: "Author",
        },
    },
});
