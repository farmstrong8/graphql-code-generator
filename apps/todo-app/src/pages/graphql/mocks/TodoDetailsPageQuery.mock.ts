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
    __typename: "Query";
    todo: {
        __typename: "Todo";
        id: "45e7d38e-4b16-406c-bb3d-08c58b1e2a97";
        title: "Consequatur dolores et suscipit vitae.";
        completed: false;
    };
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "45e7d38e-4b16-406c-bb3d-08c58b1e2a97",
        title: "Consequatur dolores et suscipit vitae.",
        completed: false,
    },
});

type TodoDetailsPageAsError = {
    __typename: "Query";
    todo: {
        __typename: "Error";
        message: "Ut nihil ab rerum aut et ratione laudantium.";
    };
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Ut nihil ab rerum aut et ratione laudantium.",
    },
});
