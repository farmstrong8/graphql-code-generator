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
    todos: Array<{
        id: string;
        title: string;
        completed: boolean;
        dueAt: string;
        author: {};
    }>;
};

export const aTodosPage = createBuilder<TodosPage>({
    __typename: "Query",
    todos: {
        __typename: "Todo",
        id: "081d863e-ba52-4d68-878f-90cbf39d9985",
        title: "Nemo molestiae sed et incidunt saepe.",
        completed: false,
        dueAt: "1979-03-20",
        author: {
            __typename: "Author",
        },
    },
});
