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
        id: "a7133b43-2415-4046-8036-398886429e5d";
        title: "Ad vel voluptas vitae inventore.";
        completed: false;
    };
};

export const aTodoDetailsPageAsTodo = createBuilder<TodoDetailsPageAsTodo>({
    __typename: "Query",
    todo: {
        __typename: "Todo",
        id: "a7133b43-2415-4046-8036-398886429e5d",
        title: "Ad vel voluptas vitae inventore.",
        completed: false,
    },
});

type TodoDetailsPageAsError = {
    __typename: "Query";
    todo: {
        __typename: "Error";
        message: "Nam sed quis sunt quis.";
    };
};

export const aTodoDetailsPageAsError = createBuilder<TodoDetailsPageAsError>({
    __typename: "Query",
    todo: {
        __typename: "Error",
        message: "Nam sed quis sunt quis.",
    },
});
