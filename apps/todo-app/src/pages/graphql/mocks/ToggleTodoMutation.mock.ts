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
    toggleTodo: {
        id: string;
        title: string;
        completed: boolean;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "ed331587-8a9a-4433-9214-84dc0f2877ad",
        title: "Accusamus maxime fuga ut.",
        completed: false,
    },
});
