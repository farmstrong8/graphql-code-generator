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

type AddTodo = {
    __typename: "Mutation";
    addTodo: {
        __typename: "Todo";
        id: "32eff346-68e3-4862-a5d5-4571a9285cfc";
        title: "Cum velit aperiam eius iure rerum possimus ullam quibusdam.";
        completed: true;
    };
};

export const aAddTodo = createBuilder<AddTodo>({
    __typename: "Mutation",
    addTodo: {
        __typename: "Todo",
        id: "32eff346-68e3-4862-a5d5-4571a9285cfc",
        title: "Cum velit aperiam eius iure rerum possimus ullam quibusdam.",
        completed: true,
    },
});
