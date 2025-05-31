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
        id: "2e49a648-6da6-4f80-bd61-21c41ce304a1";
        title: "Inventore voluptatem illum est.";
        completed: true;
    };
};

export const aToggleTodo = createBuilder<ToggleTodo>({
    __typename: "Mutation",
    toggleTodo: {
        __typename: "Todo",
        id: "2e49a648-6da6-4f80-bd61-21c41ce304a1",
        title: "Inventore voluptatem illum est.",
        completed: true,
    },
});
