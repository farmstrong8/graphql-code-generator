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

type TodoDetailsPageAsTodo = {
    todo: object;
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "388f5c9d-a303-41e3-abae-3d6de68438ea",
        title: "Accusantium beatae voluptatem non et ipsa soluta et.",
        completed: true,
    },
});

type TodoDetailsPageAsError = {
    todo: object;
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Voluptatem sint beatae maxime sit.",
    },
});
