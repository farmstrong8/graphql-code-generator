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
        id: "20dc3b99-6e0e-4475-a934-a8c6387a34c7";
        title: "Voluptates molestiae et est et molestiae debitis ut.";
        completed: false;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "20dc3b99-6e0e-4475-a934-a8c6387a34c7",
        title: "Voluptates molestiae et est et molestiae debitis ut.",
        completed: false,
    },
});
