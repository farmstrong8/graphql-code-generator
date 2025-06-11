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

type TodoDetailsPageQueryAsTodo = {
    __typename: "Query";
    todo: {
        id: string;
        title: string;
        completed: boolean;
        __typename: "Todo";
    };
};

export const aTodoDetailsPageQueryAsTodo =
    createBuilder<TodoDetailsPageQueryAsTodo>({
        __typename: "Query",
        todo: {
            __typename: "Todo",
            id: "b0321cbb-8068-41fe-b73e-1757dddf1a7b",
            title: "Sit quia adipisci enim voluptate placeat ex et recusandae aut.",
            completed: true,
        },
    });

type TodoDetailsPageQueryAsError = {
    __typename: "Query";
    todo: {
        message: string;
        __typename: "Error";
    };
};

export const aTodoDetailsPageQueryAsError =
    createBuilder<TodoDetailsPageQueryAsError>({
        __typename: "Query",
        todo: {
            __typename: "Error",
            message: "Hic et quisquam quia voluptas.",
        },
    });
