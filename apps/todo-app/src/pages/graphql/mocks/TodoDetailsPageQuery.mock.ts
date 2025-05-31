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
            id: "de99c238-123a-4485-8d58-c4ce50d58707",
            title: "Odio est quas dolores optio ut.",
            completed: false,
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
            message: "Dolore eum sint sed et.",
        },
    });
