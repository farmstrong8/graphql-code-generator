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
            id: "fc6dac5b-1f96-44a2-a38e-e6dce4a96b09",
            title: "Natus occaecati delectus aliquam necessitatibus quibusdam voluptatum enim.",
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
            message: "Iste consectetur ipsum et eum illo laudantium.",
        },
    });
