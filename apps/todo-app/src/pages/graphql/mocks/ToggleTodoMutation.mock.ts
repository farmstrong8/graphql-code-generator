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

type ToggleTodo = {
    __typename: "Mutation";
    toggleTodo: {
        __typename: "Todo";
        id: "8e521f6c-4c06-4009-92cf-d43cdc26f98e";
        title: "Porro at debitis et velit porro dolores quaerat occaecati.";
        completed: false;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "8e521f6c-4c06-4009-92cf-d43cdc26f98e",
        title: "Porro at debitis et velit porro dolores quaerat occaecati.",
        completed: false,
    },
});
